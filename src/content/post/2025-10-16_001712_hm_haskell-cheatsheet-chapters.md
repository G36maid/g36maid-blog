---
title: "Haskell Cheatsheet (Chapters 1-3)"
description: "This cheatsheet summarizes the core functions, syntax, and concepts from chapters 1-3 in a table format for quick reference."
pubDate: 2025-10-16 00:17:12 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1760545032
category: essay
---

This cheatsheet summarizes the core functions, syntax, and concepts from chapters 1-3 in a table format for quick reference.

## Chapter 1: Basics, Functions, and Types

| Syntax / Concept | Definition | Example |
| :--- | :--- | :--- |
| **`let...in...`** | Defines local variables for an expression. The entire `let` block is an expression. | `let x = 5 in x * 2` → `10` |
| **`where`** | Defines local variables for a function, scoped across all guards. | `area r = pi * r^2 where pi = 3.14` |
| **Guards (`|`)** | A series of conditional expressions, often cleaner than nested `if/then/else`. | `sign x \| x > 0 = 1 \| otherwise = 0` |
| **Currying** | Functions take one argument and return new functions until all arguments are supplied. | `let add5 = (+) 5` |
| **`(.)` Composition**| `(g . f) x` is `g(f(x))`. Chains functions right-to-left. | `let odd = not . even` |
| **`($)` Application**| Low-precedence function application to avoid parentheses. | `sum $ map (*2) [1..10]` |

## Chapter 2: Lists

### List Construction & Basic Properties

| Function | Type | Definition | Example |
| :--- | :--- | :--- | :--- |
| **`:` (Cons)** | `a -> [a] -> [a]` | Prepends an element. O(1). | `1 : [2,3]` → `[1,2,3]` |
| **`(++)` (Append)** | `[a] -> [a] -> [a]` | Concatenates two lists. O(n). | `[1,2] ++ [3,4]` → `[1,2,3,4]` |
| **`head`** | `[a] -> a` | Returns the first element. **Error on `[]`**. | `head [1,2]` → `1` |
| **`tail`** | `[a] -> [a]` | Returns all but the first element. **Error on `[]`**. | `tail [1,2]` → `[2]` |
| **`last`** | `[a] -> a` | Returns the last element. **Error on `[]`**. | `last [1,2]` → `2` |
| **`init`** | `[a] -> [a]` | Returns all but the last element. **Error on `[]`**. | `init [1,2]` → `[1]` |
| **`(!!)`** | `[a] -> Int -> a` | Returns element at index. **Error on invalid index**. | `[1,2,3] !! 1` → `2` |
| **`length`** | `[a] -> Int` | Returns the number of elements. | `length [1,2]` → `2` |
| **`null`** | `[a] -> Bool` | Checks if a list is empty. | `null []` → `True` |

### Higher-Order Functions

| Function | Type | Definition | Example |
| :--- | :--- | :--- | :--- |
| **`map`** | `(a -> b) -> [a] -> [b]` | Applies a function to every element. | `map (*2) [1,2]` → `[2,4]` |
| **`filter`** | `(a -> Bool) -> [a] -> [a]` | Keeps elements that satisfy a predicate. | `filter even [1,2]` → `[2]` |
| **`zip`** | `[a] -> [b] -> [(a,b)]` | Pairs elements from two lists. | `zip [1,2] "ab"` → `[(1,'a'),(2,'b')]` |
| **`concat`** | `[[a]] -> [a]` | Flattens a list of lists. | `concat [[1],[2]]` → `[1,2]` |
| **`takeWhile`** | `(a -> Bool) -> [a] -> [a]` | Takes elements while a predicate is true. | `takeWhile (<3) [1,2,3,1]` → `[1,2]` |
| **`dropWhile`** | `(a -> Bool) -> [a] -> [a]` | Drops elements while a predicate is true. | `dropWhile (<3) [1,2,3,1]` → `[3,1]` |

### List Comprehensions

<!-- | Syntax | Definition | Example |
| :--- | :--- | :--- | -->
| `[out | v <- list, guard]` | A descriptive way to create lists. 
| `[x*x \| x <- [1..5], odd x]` → `[1,9,25]` |

## Chapter 3: Induction & Theory

| Concept | Definition |
| :--- | :--- |
| **Structural Induction on Lists** | Prove for `[]` (Base Case), then prove for `(x:xs)` assuming it holds for `xs` (Inductive Step). |
| **Structural Induction on Trees** | Prove for `Null` (Base Case), then prove for `(Node x l r)` assuming it holds for `l` and `r` (Inductive Step). |
| **`⊥` (Bottom)** | Represents a non-terminating computation or an error (`undefined`). |
| **Strict Function** | A function `f` where `f ⊥ = ⊥`. It cannot recover from a broken input. |
| **Non-Strict Function** | A function `f` where `f ⊥` can produce a value (e.g., `const 1 ⊥` → `1`). |
