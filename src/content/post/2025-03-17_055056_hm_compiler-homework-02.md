---
title: "Compiler Homework 02"
description: "G36maid"
pubDate: 2025-03-17 05:50:56 +0800
tags: []
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1742161856
---

- G36maid
- 鍾詠傑

## Question 1

### **Step 1: Parse the Expression**
The given **Micro program**:

```plaintext
BEGIN A := B - (C - D); END SCANEOF
```
can be simplified to:

```plaintext
A := B - (C - D)
```

### **Operations Involved:**

1. **Subtraction operation (`C - D`)**
2. **Subtraction operation (`B - (C - D)`)**
3. **Assignment to `A`**

---

### **Step 2: Determine Function Calls**
To parse and evaluate the expression, the following functions are involved:

- **Expression parsing**
- **Assignment handling**
- **Operator evaluation**

Specific functions:
- `parse_program()`
- `parse_statement()`
- `parse_assignment()`
- `parse_expression()`
- `parse_term()`
- `parse_factor()`

---

### **Step 3: Construct the Calling Graph**

```
parse_program()
│
└── parse_statement()
    │
    └── parse_assignment()
        │
        └── parse_expression()
            │
            ├── parse_term()  [B]
            │
            └── parse_operator('-')
                │
                ├── parse_factor()  [B]
                │
                └── parse_expression()
                    │
                    ├── parse_term()  [C]
                    │
                    └── parse_operator('-')
                        │
                        ├── parse_factor()  [C]
                        │
                        └── parse_factor()  [D]
```


---

## Question 2

### **Step 1: Parse the Expression**
The given **Micro program**:

```plaintext
BEGIN A := B - +C; END SCANEOF
```
can be simplified to:

```plaintext
A := B - +C
```

### **Operations Involved:**

1. **Unary plus (`+C`)**
2. **Subtraction (`B - +C`)**
3. **Assignment (`A := ...`)**

---

### **Step 2: Identify Function Calls**
To parse and evaluate the expression, the following functions are involved:

- **Program parsing** (`parse_program`)
- **Statement parsing** (`parse_statement`)
- **Assignment handling** (`parse_assignment`)
- **Expression parsing** (`parse_expression`)
- **Operator evaluation** (`parse_operator`)
- **Term and factor handling** (`parse_term`, `parse_factor`)

---

### **Step 3: Construct the Calling Graph**


```
parse_program()
│
└── parse_statement()
    │
    └── parse_assignment()
        │
        └── parse_expression()
            │
            ├── parse_term()  [B]
            │
            └── parse_operator('-')
                │
                ├── parse_factor()  [B]
                │
                └── parse_expression()
                    │
                    ├── parse_operator('+')
                    │
                    └── parse_factor()  [C]
```
