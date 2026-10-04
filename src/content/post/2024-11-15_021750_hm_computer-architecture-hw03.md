---
title: "Computer architecture HW03"
description: "The reason print(0.1 + 0.2 == 0.3) returns False in Python (and many other programming languages) is due to how floating-point numbers ar…"
pubDate: 2024-11-15 02:17:50 +0800
tags: ["python", "final", "algorithm", "memory"]
draft: true
source: "hackmd"
sourceType: "note"
sourceTimestamp: 1731608270
category: programming
---

## Q1
The reason `print(0.1 + 0.2 == 0.3)` returns `False` in Python (and many other programming languages) is due to how floating-point numbers are represented in computer memory.

### Explanation
1. **Binary Representation of Floating-Point Numbers**:
   Computers represent floating-point numbers (like 0.1 and 0.2) in binary, using a finite number of bits. However, numbers like 0.1 and 0.2 do not have exact representations in binary form—they become repeating fractions. For instance:
   - In binary, 0.1 is approximately `0.0001100110011001100...` (repeating).
   - Similarly, 0.2 is approximately `0.001100110011001100...` (repeating).

2. **Imprecision in Representation**:
   When you add these two approximations, the result is slightly off from the true mathematical sum. The computer’s internal representation of `0.1 + 0.2` will be close to, but not exactly, `0.3`. Instead, it might be something like `0.30000000000000004`.

3. **Comparison Result**:
   When you compare `0.1 + 0.2` to `0.3`, Python checks if they are *exactly* equal. Due to the slight imprecision in the floating-point representation, `0.1 + 0.2` is not exactly equal to `0.3`, so the expression evaluates to `False`.
   
## Q2

To add the two IEEE 754 single-precision (32-bit) floating-point numbers $0xC333600$ and $0x42E27400$, let's break down the calculation step-by-step, first converting each number to its binary form and then performing the addition.

### Step 1: Convert each hexadecimal number to binary

#### 1.1 Convert $0xC333600$

The 32-bit IEEE 754 binary representation has the following structure:
- **Sign bit**: 1 bit
- **Exponent**: 8 bits
- **Mantissa (fraction)**: 23 bits

The hexadecimal number $0xC333600$ in binary is:
```
1100 0011 0011 0011 0011 0000 0000 0000
```
Splitting it according to the IEEE 754 format:
- **Sign bit**: `1` (indicating a negative number)
- **Exponent**: `10000110`
- **Mantissa**: `01100110011000000000000`

So, $0xC333600$ represents:
- **Sign bit**: $1$ (negative)
- **Exponent**: `10000110` in binary = $134$ in decimal
- **Mantissa**: $1.01100110011000000000000$ (with the implicit leading 1)

#### 1.2 Calculate the value of $0xC333600$

The value of a floating-point number is calculated as:
$$
\text{value} = (-1)^{\text{sign}} \times 1.\text{mantissa} \times 2^{(\text{exponent} - 127)}
$$
For $0xC333600$:
- **Sign** = $1$ (negative)
- **Exponent** = $134$, so $134 - 127 = 7$
- **Mantissa** = $1.01100110011000000000000$ in binary

Converting the mantissa:
$$
1.01100110011000000000000 = 1 + 0.375 + 0.09375 = 1.46875
$$

Thus, the value is:
$$
\text{value} = -1 \times 1.46875 \times 2^7 = -1.46875 \times 128 = -188.5
$$

#### 1.3 Convert $0x42E27400$

The hexadecimal number $0x42E27400$ in binary is:
```
0100 0010 1110 0010 0111 0100 0000 0000
```
Splitting it according to the IEEE 754 format:
- **Sign bit**: `0` (positive)
- **Exponent**: `10000101`
- **Mantissa**: `11000100111010000000000`

So, $0x42E27400$ represents:
- **Sign bit**: $0$ (positive)
- **Exponent**: `10000101` in binary = $133$ in decimal
- **Mantissa**: $1.11000100111010000000000$

#### 1.4 Calculate the value of $0x42E27400$

For $0x42E27400$:
- **Sign** = $0$ (positive)
- **Exponent** = $133$, so $133 - 127 = 6$
- **Mantissa** = $1.11000100111010000000000$

Converting the mantissa:
$$
1.11000100111010000000000 = 1 + 0.75 + 0.078125 + 0.0146484375 = 1.8427734375
$$

Thus, the value is:
$$
\text{value} = 1.8427734375 \times 2^6 = 1.8427734375 \times 64 = 117.9365234375
$$

### Step 2: Perform the Addition

Now we add the two values obtained:
$$
-188.5 + 117.9365234375 = -70.5634765625
$$

### Step 3: Convert the Result Back to IEEE 754 Format

To represent $-70.5634765625$ as a 32-bit IEEE 754 floating-point number:

1. **Sign bit**: $1$ (since the result is negative)
2. **Magnitude of the number**: $70.5634765625$
3. **Binary representation of $70.5634765625$**:
   - In binary, $70$ is `1000110`, and the fractional part `.5634765625` is approximately `0.1001001...`, giving `1000110.1001001`.
   - Normalized form: $1.0001101001 \times 2^6$
4. **Exponent**: $127 + 6 = 133$, which is `10000101` in binary.
5. **Mantissa**: `00011010010000000000000` (rounded to 23 bits)

Combining these, we get:
```
Sign bit:     1
Exponent:     10000101
Mantissa:     00011010010000000000000
```

In hexadecimal, this is:
$$
\text{Answer} = \textbf{0xC28D2000}
$$

### Final Answer
The sum of $0xC333600$ and $0x42E27400$ in IEEE 754 format is:
$$
\boxed{0xC28D2000}
$$

If we interpret both $0x0C333600$ and $0x42E27400$ as signed 32-bit integers (rather than floating-point numbers), we’ll perform a straightforward integer addition in hexadecimal.

Let's break down the calculation.

### Step 1: Interpret Each Hexadecimal Value as a Signed Integer

1. **0x0C333600**:
   - Since $0x0C333600$ is less than $0x80000000$, it is a positive integer.
   - Convert $0x0C333600$ to decimal:
     $$
     0x0C333600 = 204669952
     $$

2. **0x42E27400**:
   - Similarly, $0x42E27400$ is less than $0x80000000$, so it is also positive.
   - Convert $0x42E27400$ to decimal:
     $$
     0x42E27400 = 1128642560
     $$

### Step 2: Add the Two Integers

Add the decimal values obtained:
$$
204669952 + 1128642560 = 1333312512
$$

### Step 3: Convert the Result Back to Hexadecimal

Convert $1333312512$ back to hexadecimal:
$$
1333312512 = 0x4F15CA00
$$

### Final Answer
So, if both numbers are treated as signed integers, the result of $0x0C333600 + 0x42E27400$ is:
$$
\boxed{0x4F15CA00}
$$


## P3
I use following cpp code to find the best format

get the output

* 10-bit representation for 1.3:
* Sign: 0
* Exponent: 0 (decimal: 0)
* Fraction: 01001101 (decimal: 77)
* gap between: 0.000781298
* Approximate Value: 1.30078
* Hex Representation: 0x4d

### code :
```cpp
struct CustomFloat {
    unsigned int sign : 1;
    unsigned int exponent : 1;  // Set exponent to 0 for no scaling
    unsigned int fraction : 8;  // 8-bit fraction for precision

    float toFloat() const {
        int bias = 0; // Bias for 1-bit exponent is 0
        int e = static_cast<int>(exponent) - bias;
        float mantissa = 1.0f + 
            static_cast<float>(fraction) / (1 << 8);
        return (sign ? -1.0f : 1.0f) * mantissa * pow(2.0f, e);
    }
};

int main() {
    float target = 1.3f;
    CustomFloat bestMatch = {0, 0, 0b01001101}; 
    // Fraction for closest approximation to 0.3

    cout << "10-bit representation for 1.3:\n";
    cout << "Sign: " << bestMatch.sign << "\n";
    cout << "Exponent: " << bitset<1>(bestMatch.exponent) 
         << " (decimal: " << bestMatch.exponent << ")\n";
    cout << "Fraction: " << bitset<8>(bestMatch.fraction) 
         << " (decimal: " << bestMatch.fraction << ")\n";
    cout << "gap between: " << abs(target - bestMatch.toFloat()) << "\n";
    cout << "Approximate Value: " << bestMatch.toFloat() << "\n";
    cout << "Hex Representation: 0x" 
         << hex << ((bestMatch.sign << 9) 
                | (bestMatch.exponent << 8) 
                | bestMatch.fraction) << "\n";

    return 0;
}
```

### Code Explanation

- **Struct Definition (`CustomFloat`)**: 
  - `sign`: 1-bit field to represent positive (`0`) or negative (`1`).
  - `exponent`: 1-bit for the exponent, used here with a bias of `0` to avoid scaling.
  - `fraction`: 8-bit field to hold the fraction value, allowing greater precision.
  
- **Function `toFloat()`**:
  - Calculates the actual floating-point value.
  - `bias`: Set to `0`, matching the single-bit exponent field.
  - `e`: The effective exponent after adjusting for the bias.
  - `mantissa`: Calculated as `1 + fraction / 256` to approximate `1.3`.
  - Returns the calculated value using the formula $(-1)^S \times (1 + F) \times 2^{(E - \text{bias})}$.

- **Main Function**:
  - Defines `CustomFloat` with specific values to approximate `1.3`.
  - Outputs the 10-bit format's binary fields and the hexadecimal representation (expected as `0x4C`).

### P4
#### RISC-V Multiplication vs. Division Performance

- **Algorithm Complexity**  
  - **Multiplication**: Uses efficient, parallelizable algorithms like Booth’s or Wallace tree, allowing rapid computation.
  - **Division**: Relies on more complex, iterative algorithms (e.g., restoring division), increasing the cycle count.

- **Pipeline and Latency**  
  - **Multiplication**: Can be pipelined efficiently, minimizing latency.
  - **Division**: Sequential dependencies limit pipelining, resulting in higher latency.

- **Hardware Design**  
  - **Multiplication**: Uses simpler, dedicated units optimized for fast calculations.
  - **Division**: Requires a more complex unit, needing more cycles per operation.

- **Parallelism**  
  - **Multiplication**: Achieves high parallelism by computing partial products simultaneously.
  - **Division**: Difficult to parallelize due to step-by-step dependencies, slowing execution.

In short, division has a higher CPI than multiplication due to these architectural constraints.
