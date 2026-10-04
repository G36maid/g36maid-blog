---
title: "Notifier System Report: Node Online/Offline Behavior"
description: "This report details how the Headscale notifier system handles the online and offline status of machines (nodes) and propagates these chan…"
pubDate: 2025-07-24 05:17:08 +0800
tags: ["headscale", "memory", "database", "tailscale"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1753305428
category: self-hosting
---

This report details how the Headscale notifier system handles the online and offline status of machines (nodes) and propagates these changes across the network.

## 1. Node Comes Online

When a machine (node) successfully connects to Headscale, the notifier updates its status and informs other connected nodes:

*   **Node Connection and Channel Registration:**
    *   Upon a Tailscale client establishing a connection (e.g., via a "poll" or "map" request), Headscale's server-side components (likely in `hscontrol/poll.go` or `hscontrol/handlers.go`) invoke the `notifier.AddNode()` method.
    *   `notifier.AddNode(nodeID, c)` registers the newly connected node's unique `nodeID` and associates it with a dedicated Go channel (`c`). This channel will be used by Headscale to send future updates specifically to this node.
    *   Crucially, within `AddNode`, the notifier's internal `n.connected` concurrent map is updated via `n.connected.Store(nodeID, true)`, explicitly marking the node as online. The `notifierNodeUpdateChans` metric is also incremented.

*   **Reflecting Online Status in MapResponses:**
    *   When other already-connected nodes poll Headscale for network updates, the `hscontrol/mapper/mapper.go` component generates a `MapResponse` for them.
    *   During this `MapResponse` generation, the `mapper` iterates through all known peers and queries their online status using `m.notif.IsLikelyConnected(peer.ID)`.
    *   Because the newly online node's status was set to `true` in the notifier's `n.connected` map, `IsLikelyConnected` will return `true` for this node.
    *   Consequently, the `MapResponse` sent to *other* nodes will include the newly online machine with its `IsOnline` field correctly set to `true`.

*   **Propagating Peer Changes (Batched Updates):**
    *   While `AddNode` primarily updates the notifier's internal state for individual node communication, a change in a node's online status (or other attributes) can trigger a broader `types.StateUpdate` of type `types.StatePeerChanged`.
    *   This `StatePeerChanged` update is then passed to `notifier.NotifyAll(ctx, update)`.
    *   The `batcher` component within the notifier aggregates these `StatePeerChanged` updates. After a short, configurable delay, the `batcher`'s `flush()` method sends a consolidated update to all relevant connected nodes, ensuring they are informed about the changes in peer status across the network.

## 2. Node Goes Offline

When a machine (node) goes offline, the notifier system handles this event to update its status and inform other connected nodes:

*   **Node Disconnection and Channel Removal:**
    *   When a Tailscale client disconnects from Headscale (e.g., due to network issues, client shutdown, or explicit logout), the Headscale server detects this event.
    *   The `notifier.RemoveNode(nodeID, c)` method is called, typically from the goroutine that was managing the long-polling connection for that specific node.
    *   `notifier.RemoveNode()` performs the following actions:
        *   It removes the node's update channel from the `n.nodes` map.
        *   It updates the `n.connected` map by calling `n.connected.Store(nodeID, false)`, explicitly marking the node as offline.
        *   The `notifierNodeUpdateChans` metric is decremented.
        *   The channel `c` associated with the disconnected node is closed, signaling to any waiting goroutines that the connection is no longer active.

*   **Reflecting Offline Status in MapResponses:**
    *   When other active nodes poll Headscale for network updates, the `hscontrol/mapper/mapper.go` component generates their `MapResponse`.
    *   During this process, the `mapper` queries the online status of peers using `m.notif.IsLikelyConnected(peer.ID)`.
    *   Since the disconnected node's status was set to `false` in the notifier's `n.connected` map, `IsLikelyConnected` will now return `false` for this node.
    *   Consequently, the `MapResponse` sent to *other* nodes will reflect the now-offline machine with its `IsOnline` field set to `false`.

*   **Propagating Peer Changes (Batched Updates):**
    *   Similar to a node coming online, a node going offline also triggers a `types.StateUpdate` of type `types.StatePeerChanged` (or potentially `types.StatePeerChangedPatch` for incremental changes).
    *   This update is passed to `notifier.NotifyAll(ctx, update)`.
    *   The `batcher` component aggregates these `StatePeerChanged` updates. After its configured delay, the `batcher`'s `flush()` method sends a consolidated update to all relevant connected nodes, ensuring they are informed about the change in the peer's online status across the network.

## 3. Online/Offline Status Persistence

The `IsOnline` status of a node is **not directly stored in the database**.

Instead, it is a **runtime property** managed by the `notifier` package:

*   The `notifier.Notifier` struct maintains an in-memory concurrent map (`xsync.MapOf[types.NodeID, bool]`) called `connected`. This map stores the current online status of each node.
*   When a node connects, `notifier.AddNode` updates this in-memory map to `true`.
*   When a node disconnects, `notifier.RemoveNode` updates this in-memory map to `false`.
*   The `hscontrol/mapper/mapper.go` component, when generating `MapResponse` for clients, queries this in-memory `connected` map via `m.notif.IsLikelyConnected(peer.ID)` to determine if a peer is online.

This design choice likely prioritizes real-time accuracy and avoids unnecessary database writes for frequently changing connection states. The database stores persistent node information (e.g., keys, IPs, hostname), while the `notifier` handles the ephemeral online/offline status.
