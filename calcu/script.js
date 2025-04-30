// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Show welcome screen for 4 seconds
    setTimeout(() => {
        document.getElementById('welcome-screen').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
    }, 4000);

    // Initialize history - change to a single unified history array
    const history = JSON.parse(localStorage.getItem('unifiedCalculatorHistory')) || [];
    let currentCalculator = "";

    // Initialize calculator selection
    const calculatorSelect = document.getElementById('calculator-type');
    calculatorSelect.addEventListener('change', switchCalculator);

    // Initialize history button
    const historyBtn = document.getElementById('history-btn');
    const historyPanel = document.getElementById('history-panel');
    
    historyBtn.addEventListener('click', () => {
        historyPanel.classList.toggle('hidden');
        updateHistoryDisplay();
    });

    // Clear history button
    document.getElementById('clear-history').addEventListener('click', () => {
        localStorage.removeItem('unifiedCalculatorHistory');
        history.length = 0; // Clear the array
        updateHistoryDisplay();
    });

    // Initialize all calculators
    initBasicCalculator();
    initCurrencyConverter();
    initUnitConverter();
    initRemainingCalculators();

    // Show the first calculator
    switchCalculator();

    // ===== Core Functions =====

    // Switch between calculators
    function switchCalculator() {
        currentCalculator = calculatorSelect.value;
        
        // Hide all calculators
        document.querySelectorAll('.calculator').forEach(calc => {
            calc.classList.add('hidden');
        });
        
        // Show selected calculator
        document.getElementById(currentCalculator).classList.remove('hidden');
    }

    // Save calculation to history - unified across all calculators
    function saveToHistory(calculatorType, calculation) {
        // Get readable calculator name
        const calculatorName = getCalculatorName(calculatorType);
        
        // Add to the beginning of the array
        history.unshift({
            id: Date.now(),
            calculatorType,
            calculatorName,
            calculation,
            timestamp: new Date().toLocaleString()
        });
        
        // Limit history to 30 items total
        if (history.length > 30) {
            history.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('unifiedCalculatorHistory', JSON.stringify(history));
    }

    // Get readable calculator name
    function getCalculatorName(calculatorType) {
        const names = {
            'basic': 'Basic Calculator',
            'currency': 'Currency Converter',
            'unit': 'Unit Converter',
            'discount': 'Discount Calculator',
            'percentage': 'Percentage Calculator',
            'tax': 'Sales Tax Calculator',
            'date': 'Date Calculator',
            'fuel': 'Fuel Cost Calculator',
            'gpa': 'GPA Calculator',
            'bmi': 'BMI Calculator',
            'hex': 'Hexadecimal Calculator',
            'loan': 'Loan Calculator',
            'ovulation': 'Ovulation Calculator',
            'savings': 'Savings Calculator',
            'tip': 'Tip Calculator',
            'unit-price': 'Unit Price Calculator',
            'world-time': 'World Time Converter'
        };
        
        return names[calculatorType] || calculatorType;
    }

    // Update history display - unified view
    function updateHistoryDisplay() {
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        
        if (history.length > 0) {
            history.forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'history-item';
                historyItem.innerHTML = `
                    <div class="history-content">
                        <div class="history-calculator">${item.calculatorName}</div>
                        <div class="history-calculation">${item.calculation}</div>
                        <small>${item.timestamp}</small>
                    </div>
                    <button class="delete-item" data-id="${item.id}" data-type="${item.calculatorType}">❌</button>
                `;
                historyList.appendChild(historyItem);
            });
            
            // Add delete event listeners
            document.querySelectorAll('.delete-item').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = parseInt(e.target.getAttribute('data-id'));
                    const calcType = e.target.getAttribute('data-type');
                    
                    // Remove this item from history
                    const index = history.findIndex(item => item.id === id);
                    if (index !== -1) {
                        history.splice(index, 1);
                        localStorage.setItem('unifiedCalculatorHistory', JSON.stringify(history));
                    }
                    
                    // Update display
                    updateHistoryDisplay();
                    
                    // Switch to the appropriate calculator
                    if (calcType) {
                        calculatorSelect.value = calcType;
                        switchCalculator();
                    }
                });
            });
        } else {
            historyList.innerHTML = '<div class="history-item">No history available</div>';
        }
    }

    // ===== Basic Calculator =====
    function initBasicCalculator() {
        const calculator = {
            displayValue: '0',
            firstOperand: null,
            waitingForSecondOperand: false,
            operator: null,
            previousCalculation: ''
        };

        const display = document.querySelector('.current-operand');
        const previousDisplay = document.querySelector('.previous-operand');
        
        // Update display
        function updateDisplay() {
            display.textContent = calculator.displayValue;
            previousDisplay.textContent = calculator.previousCalculation;
        }
        
        // Handle number input
        function inputDigit(digit) {
            const { displayValue, waitingForSecondOperand } = calculator;
            
            if (waitingForSecondOperand) {
                calculator.displayValue = digit;
                calculator.waitingForSecondOperand = false;
            } else {
                calculator.displayValue = displayValue === '0' ? digit : displayValue + digit;
            }
        }
        
        // Handle decimal point
        function inputDecimal(dot) {
            if (calculator.waitingForSecondOperand) {
                calculator.displayValue = '0.';
                calculator.waitingForSecondOperand = false;
                return;
            }
            
            if (!calculator.displayValue.includes(dot)) {
                calculator.displayValue += dot;
            }
        }
        
        // Handle operators
        function handleOperator(nextOperator) {
            const { firstOperand, displayValue, operator } = calculator;
            const inputValue = parseFloat(displayValue);
            
            if (operator && calculator.waitingForSecondOperand) {
                calculator.operator = nextOperator;
                return;
            }
            
            if (firstOperand === null && !isNaN(inputValue)) {
                calculator.firstOperand = inputValue;
                // Show the current number and operator in the previous display
                if (nextOperator !== '=') {
                    const displayOperator = formatOperator(nextOperator);
                    calculator.previousCalculation = `${inputValue} ${displayOperator}`;
                }
            } else if (operator) {
                const result = calculate(firstOperand, inputValue, operator);
                
                calculator.displayValue = `${parseFloat(result.toFixed(7))}`;
                calculator.firstOperand = result;
                
                // Format operator for display
                const displayOperator = formatOperator(operator);
                
                // Format the result with proper decimal places
                const formattedResult = formatResult(result);
                
                // Save to history with proper formatting
                const calculation = `${firstOperand} ${displayOperator} ${inputValue} = ${formattedResult}`;
                calculator.previousCalculation = calculation;
                saveToHistory('basic', calculation);
                
                // If continuing with another operation, update the previous calculation display
                if (nextOperator !== '=') {
                    const nextDisplayOperator = formatOperator(nextOperator);
                    calculator.previousCalculation = `${formattedResult} ${nextDisplayOperator}`;
                }
            }
            
            calculator.waitingForSecondOperand = true;
            calculator.operator = nextOperator;
        }
        
        // Format operator for display
        function formatOperator(operator) {
            switch (operator) {
                case '+':
                    return '+';
                case '-':
                    return '−';  // Unicode minus sign (U+2212)
                case '×':
                    return '×';  // Unicode multiplication sign (U+00D7)
                case '÷':
                    return '÷';  // Unicode division sign (U+00F7)
                default:
                    return operator;
            }
        }
        
        // Format result to handle decimal places properly
        function formatResult(result) {
            // If it's a whole number, don't show decimal places
            if (Number.isInteger(result)) {
                return result.toString();
            }
            // Otherwise limit to a reasonable number of decimal places
            // First try with 2 decimals
            const rounded = parseFloat(result.toFixed(2));
            // If rounding to 2 decimals gives the same as the original number, use that
            if (rounded === result) {
                return rounded.toString();
            }
            // Otherwise use up to 7 decimal places but trim trailing zeros
            return parseFloat(result.toFixed(7)).toString();
        }
        
        // Calculate result
        function calculate(firstOperand, secondOperand, operator) {
            switch (operator) {
                case '+':
                    return firstOperand + secondOperand;
                case '-':
                    return firstOperand - secondOperand;
                case '×':
                    return firstOperand * secondOperand;
                case '÷':
                    return firstOperand / secondOperand;
                case '%':
                    return (firstOperand / 100) * secondOperand;
                default:
                    return secondOperand;
            }
        }
        
        // Reset calculator
        function resetCalculator() {
            calculator.displayValue = '0';
            calculator.firstOperand = null;
            calculator.waitingForSecondOperand = false;
            calculator.operator = null;
            calculator.previousCalculation = '';
        }
        
        // Event listeners for basic calculator
        document.querySelector('.keypad').addEventListener('click', (event) => {
            const { target } = event;
            
            if (!target.matches('button')) {
                return;
            }
            
            if (target.classList.contains('operation')) {
                const operation = target.textContent;
                
                if (operation === '±') {
                    calculator.displayValue = parseFloat(calculator.displayValue) * -1;
                } else if (operation === '%') {
                    calculator.displayValue = parseFloat(calculator.displayValue) / 100;
                } else {
                    handleOperator(operation);
                }
                
                updateDisplay();
                return;
            }
            
            if (target.classList.contains('clear')) {
                resetCalculator();
                updateDisplay();
                return;
            }
            
            if (target.classList.contains('equals')) {
                handleOperator('=');
                updateDisplay();
                return;
            }
            
            // If it's a number or decimal point
            if (target.classList.contains('number')) {
                const value = target.textContent;
                
                if (value === '.') {
                    inputDecimal(value);
                } else {
                    inputDigit(value);
                }
                
                updateDisplay();
            }
        });
        
        // Initialize display
        updateDisplay();
    }

    // ===== Currency Converter =====
    function initCurrencyConverter() {
        // Exchange rates (fixed example rates)
        const exchangeRates = {
            USD: {
                EUR: 0.92,
                INR: 83.12
            },
            EUR: {
                USD: 1.09,
                INR: 90.44
            },
            INR: {
                USD: 0.012,
                EUR: 0.011
            }
        };

        const amountInput = document.getElementById('currency-amount');
        const fromSelect = document.getElementById('currency-from');
        const toSelect = document.getElementById('currency-to');
        const resultInput = document.getElementById('currency-result');
        const swapBtn = document.getElementById('currency-swap');
        const convertBtn = document.getElementById('currency-convert');

        // Convert currency
        function convertCurrency() {
            const amount = parseFloat(amountInput.value);
            const fromCurrency = fromSelect.value;
            const toCurrency = toSelect.value;
            
            if (isNaN(amount)) {
                resultInput.value = '';
                return;
            }
            
            if (fromCurrency === toCurrency) {
                resultInput.value = amount;
                return;
            }
            
            const rate = exchangeRates[fromCurrency][toCurrency];
            const result = amount * rate;
            
            resultInput.value = result.toFixed(2);
            
            // Save to history
            const calculation = `${amount} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`;
            saveToHistory('currency', calculation);
        }

        // Swap currencies
        function swapCurrencies() {
            const temp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = temp;
            
            // Convert again if there's a value
            if (amountInput.value) {
                convertCurrency();
            }
        }

        // Event listeners
        convertBtn.addEventListener('click', convertCurrency);
        swapBtn.addEventListener('click', swapCurrencies);
    }

    // ===== Unit Converter =====
    function initUnitConverter() {
        // Unit conversion data
        const unitConversions = {
            length: {
                units: ['meters', 'kilometers', 'feet', 'inches', 'miles', 'centimeters'],
                conversions: {
                    meters: {
                        kilometers: 0.001,
                        feet: 3.28084,
                        inches: 39.3701,
                        miles: 0.000621371,
                        centimeters: 100
                    },
                    kilometers: {
                        meters: 1000,
                        feet: 3280.84,
                        inches: 39370.1,
                        miles: 0.621371,
                        centimeters: 100000
                    },
                    feet: {
                        meters: 0.3048,
                        kilometers: 0.0003048,
                        inches: 12,
                        miles: 0.000189394,
                        centimeters: 30.48
                    },
                    inches: {
                        meters: 0.0254,
                        kilometers: 0.0000254,
                        feet: 0.0833333,
                        miles: 0.0000157828,
                        centimeters: 2.54
                    },
                    miles: {
                        meters: 1609.34,
                        kilometers: 1.60934,
                        feet: 5280,
                        inches: 63360,
                        centimeters: 160934
                    },
                    centimeters: {
                        meters: 0.01,
                        kilometers: 0.00001,
                        feet: 0.0328084,
                        inches: 0.393701,
                        miles: 0.00000621371
                    }
                }
            },
            weight: {
                units: ['kilograms', 'grams', 'pounds', 'ounces', 'tons'],
                conversions: {
                    kilograms: {
                        grams: 1000,
                        pounds: 2.20462,
                        ounces: 35.274,
                        tons: 0.001
                    },
                    grams: {
                        kilograms: 0.001,
                        pounds: 0.00220462,
                        ounces: 0.035274,
                        tons: 0.000001
                    },
                    pounds: {
                        kilograms: 0.453592,
                        grams: 453.592,
                        ounces: 16,
                        tons: 0.0005
                    },
                    ounces: {
                        kilograms: 0.0283495,
                        grams: 28.3495,
                        pounds: 0.0625,
                        tons: 0.00003125
                    },
                    tons: {
                        kilograms: 1000,
                        grams: 1000000,
                        pounds: 2204.62,
                        ounces: 35274
                    }
                }
            },
            temperature: {
                units: ['celsius', 'fahrenheit', 'kelvin'],
                conversions: {
                    celsius: {
                        fahrenheit: temp => (temp * 9/5) + 32,
                        kelvin: temp => temp + 273.15
                    },
                    fahrenheit: {
                        celsius: temp => (temp - 32) * 5/9,
                        kelvin: temp => (temp - 32) * 5/9 + 273.15
                    },
                    kelvin: {
                        celsius: temp => temp - 273.15,
                        fahrenheit: temp => (temp - 273.15) * 9/5 + 32
                    }
                }
            }
        };

        const unitTypeSelect = document.getElementById('unit-type');
        const fromSelect = document.getElementById('unit-from');
        const toSelect = document.getElementById('unit-to');
        const amountInput = document.getElementById('unit-amount');
        const resultInput = document.getElementById('unit-result');
        const swapBtn = document.getElementById('unit-swap');
        const convertBtn = document.getElementById('unit-convert');

        // Populate unit dropdowns based on type
        function populateUnitDropdowns() {
            const unitType = unitTypeSelect.value;
            const units = unitConversions[unitType].units;
            
            // Clear previous options
            fromSelect.innerHTML = '';
            toSelect.innerHTML = '';
            
            // Add new options
            units.forEach(unit => {
                fromSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
                toSelect.innerHTML += `<option value="${unit}">${unit}</option>`;
            });
            
            // Set default values
            if (units.length > 1) {
                toSelect.value = units[1];
            }
        }

        // Convert units
        function convertUnit() {
            const unitType = unitTypeSelect.value;
            const fromUnit = fromSelect.value;
            const toUnit = toSelect.value;
            const amount = parseFloat(amountInput.value);
            
            if (isNaN(amount)) {
                resultInput.value = '';
                return;
            }
            
            if (fromUnit === toUnit) {
                resultInput.value = amount;
                return;
            }
            
            let result;
            
            // Temperature requires special handling
            if (unitType === 'temperature') {
                const conversion = unitConversions[unitType].conversions[fromUnit][toUnit];
                result = conversion(amount);
            } else {
                const conversion = unitConversions[unitType].conversions[fromUnit][toUnit];
                result = amount * conversion;
            }
            
            resultInput.value = result.toFixed(2);
            
            // Save to history
            const calculation = `${amount} ${fromUnit} = ${result.toFixed(2)} ${toUnit}`;
            saveToHistory('unit', calculation);
        }

        // Swap units
        function swapUnits() {
            const temp = fromSelect.value;
            fromSelect.value = toSelect.value;
            toSelect.value = temp;
            
            // Convert again if there's a value
            if (amountInput.value) {
                convertUnit();
            }
        }

        // Event listeners
        unitTypeSelect.addEventListener('change', populateUnitDropdowns);
        convertBtn.addEventListener('click', convertUnit);
        swapBtn.addEventListener('click', swapUnits);
        
        // Initialize dropdowns
        populateUnitDropdowns();
    }
    
    // Initialize the remaining calculators
    function initRemainingCalculators() {
        // Discount Calculator
        initDiscountCalculator();
        
        // Percentage Calculator
        initPercentageCalculator();
        
        // Sales Tax Calculator
        initTaxCalculator();
        
        // Date Calculator
        initDateCalculator();
        
        // Fuel Cost Calculator
        initFuelCalculator();
        
        // GPA Calculator
        initGPACalculator();
        
        // BMI Calculator
        initBMICalculator();
        
        // Hexadecimal Calculator
        initHexCalculator();
        
        // Loan Calculator
        initLoanCalculator();
        
        // Ovulation Calculator
        initOvulationCalculator();
        
        // Savings Calculator
        initSavingsCalculator();
        
        // Tip Calculator
        initTipCalculator();
        
        // Unit Price Calculator
        initUnitPriceCalculator();
        
        // World Time Converter
        initWorldTimeConverter();
    }
    
    // ===== Discount Calculator =====
    function initDiscountCalculator() {
        const originalPriceInput = document.getElementById('original-price');
        const discountPercentInput = document.getElementById('discount-percent');
        const calculateBtn = document.getElementById('calculate-discount');
        const resultDiv = document.getElementById('discount-result');
        
        calculateBtn.addEventListener('click', () => {
            const originalPrice = parseFloat(originalPriceInput.value);
            const discountPercent = parseFloat(discountPercentInput.value);
            
            if (isNaN(originalPrice) || isNaN(discountPercent)) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            const discountAmount = originalPrice * (discountPercent / 100);
            const discountedPrice = originalPrice - discountAmount;
            
            resultDiv.innerHTML = `
                Discount Amount: $${discountAmount.toFixed(2)}<br>
                Discounted Price: $${discountedPrice.toFixed(2)}
            `;
            
            // Save to history
            const calculation = `Original: $${originalPrice.toFixed(2)}, Discount: ${discountPercent}%, Final: $${discountedPrice.toFixed(2)}`;
            saveToHistory('discount', calculation);
        });
    }
    
    // ===== Percentage Calculator =====
    function initPercentageCalculator() {
        const valueInput = document.getElementById('percentage-value');
        const percentInput = document.getElementById('percentage-percent');
        const calculateBtn = document.getElementById('calculate-percentage');
        const resultDiv = document.getElementById('percentage-result');
        
        calculateBtn.addEventListener('click', () => {
            const value = parseFloat(valueInput.value);
            const percent = parseFloat(percentInput.value);
            
            if (isNaN(value) || isNaN(percent)) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            const result = (value * percent) / 100;
            
            resultDiv.textContent = `Result: ${result}`;
            
            // Save to history
            const calculation = `${percent}% of ${value} = ${result}`;
            saveToHistory('percentage', calculation);
        });
    }
    
    // ===== Sales Tax Calculator =====
    function initTaxCalculator() {
        const amountInput = document.getElementById('tax-amount');
        const rateInput = document.getElementById('tax-rate');
        const calculateBtn = document.getElementById('calculate-tax');
        const resultDiv = document.getElementById('tax-result');
        
        calculateBtn.addEventListener('click', () => {
            const amount = parseFloat(amountInput.value);
            const rate = parseFloat(rateInput.value);
            
            if (isNaN(amount) || isNaN(rate)) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            const taxAmount = amount * (rate / 100);
            const totalAmount = amount + taxAmount;
            
            resultDiv.innerHTML = `
                Tax Amount: $${taxAmount.toFixed(2)}<br>
                Total with Tax: $${totalAmount.toFixed(2)}
            `;
            
            // Save to history
            const calculation = `Amount: $${amount.toFixed(2)}, Tax Rate: ${rate}%, Total: $${totalAmount.toFixed(2)}`;
            saveToHistory('tax', calculation);
        });
    }
    
    // ===== Date Calculator =====
    function initDateCalculator() {
        const startDateInput = document.getElementById('start-date');
        const endDateInput = document.getElementById('end-date');
        const calculateBtn = document.getElementById('calculate-date');
        const resultDiv = document.getElementById('date-result');
        
        calculateBtn.addEventListener('click', () => {
            const startDate = new Date(startDateInput.value);
            const endDate = new Date(endDateInput.value);
            
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                resultDiv.textContent = 'Please select valid dates';
                return;
            }
            
            // Calculate difference in days
            const diffTime = Math.abs(endDate - startDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Calculate months and years
            let months = (endDate.getFullYear() - startDate.getFullYear()) * 12;
            months += endDate.getMonth() - startDate.getMonth();
            const years = Math.floor(months / 12);
            const remainingMonths = months % 12;
            
            resultDiv.innerHTML = `
                Difference: ${diffDays} days<br>
                (${years} years, ${remainingMonths} months)
            `;
            
            // Save to history
            const calculation = `From ${startDateInput.value} to ${endDateInput.value} = ${diffDays} days`;
            saveToHistory('date', calculation);
        });
    }
    
    // ===== Fuel Cost Calculator =====
    function initFuelCalculator() {
        const distanceInput = document.getElementById('distance');
        const efficiencyInput = document.getElementById('fuel-efficiency');
        const priceInput = document.getElementById('fuel-price');
        const calculateBtn = document.getElementById('calculate-fuel');
        const resultDiv = document.getElementById('fuel-result');
        
        calculateBtn.addEventListener('click', () => {
            const distance = parseFloat(distanceInput.value);
            const efficiency = parseFloat(efficiencyInput.value);
            const price = parseFloat(priceInput.value);
            
            if (isNaN(distance) || isNaN(efficiency) || isNaN(price)) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            // Calculate fuel needed
            const fuelNeeded = distance / efficiency;
            
            // Calculate cost
            const cost = fuelNeeded * price;
            
            resultDiv.innerHTML = `
                Fuel Needed: ${fuelNeeded.toFixed(2)} L/gal<br>
                Fuel Cost: $${cost.toFixed(2)}
            `;
            
            // Save to history
            const calculation = `Distance: ${distance}, Efficiency: ${efficiency}, Price: $${price} = $${cost.toFixed(2)}`;
            saveToHistory('fuel', calculation);
        });
    }

    // ===== GPA Calculator =====
    function initGPACalculator() {
        const addCourseBtn = document.getElementById('add-course');
        const calculateBtn = document.getElementById('calculate-gpa');
        const resultDiv = document.getElementById('gpa-result');
        const coursesContainer = document.getElementById('courses-container');
        
        // Add course row
        addCourseBtn.addEventListener('click', () => {
            const courseRow = document.createElement('div');
            courseRow.className = 'course-row';
            courseRow.innerHTML = `
                <input type="text" class="course-name" placeholder="Course Name">
                <select class="course-grade">
                    <option value="4.0">A</option>
                    <option value="3.7">A-</option>
                    <option value="3.3">B+</option>
                    <option value="3.0">B</option>
                    <option value="2.7">B-</option>
                    <option value="2.3">C+</option>
                    <option value="2.0">C</option>
                    <option value="1.7">C-</option>
                    <option value="1.3">D+</option>
                    <option value="1.0">D</option>
                    <option value="0.0">F</option>
                </select>
                <input type="number" class="course-credits" placeholder="Credits" min="1" value="3">
                <button class="remove-course">×</button>
            `;
            
            // Add remove event listener
            const removeBtn = courseRow.querySelector('.remove-course');
            removeBtn.addEventListener('click', () => {
                courseRow.remove();
            });
            
            coursesContainer.appendChild(courseRow);
        });
        
        // Calculate GPA
        calculateBtn.addEventListener('click', () => {
            const courseRows = document.querySelectorAll('.course-row');
            
            if (courseRows.length === 0) {
                resultDiv.textContent = 'Please add at least one course';
                return;
            }
            
            let totalCredits = 0;
            let totalPoints = 0;
            let coursesList = [];
            
            courseRows.forEach(row => {
                const courseName = row.querySelector('.course-name').value || 'Course';
                const grade = parseFloat(row.querySelector('.course-grade').value);
                const credits = parseFloat(row.querySelector('.course-credits').value);
                
                if (!isNaN(grade) && !isNaN(credits)) {
                    totalPoints += grade * credits;
                    totalCredits += credits;
                    coursesList.push(`${courseName}: ${grade}`);
                }
            });
            
            if (totalCredits === 0) {
                resultDiv.textContent = 'Please enter valid credits';
                return;
            }
            
            const gpa = totalPoints / totalCredits;
            
            resultDiv.textContent = `GPA: ${gpa.toFixed(2)}`;
            
            // Save to history
            const calculation = `GPA: ${gpa.toFixed(2)} (${coursesList.join(', ')})`;
            saveToHistory('gpa', calculation);
        });
    }
    
    // ===== BMI Calculator =====
    function initBMICalculator() {
        const heightInput = document.getElementById('height');
        const weightInput = document.getElementById('weight');
        const calculateBtn = document.getElementById('calculate-bmi');
        const resultDiv = document.getElementById('bmi-result');
        
        calculateBtn.addEventListener('click', () => {
            const height = parseFloat(heightInput.value) / 100; // Convert to meters
            const weight = parseFloat(weightInput.value);
            
            if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            const bmi = weight / (height * height);
            let category = '';
            
            if (bmi < 18.5) {
                category = 'Underweight';
            } else if (bmi < 25) {
                category = 'Normal weight';
            } else if (bmi < 30) {
                category = 'Overweight';
            } else {
                category = 'Obese';
            }
            
            resultDiv.textContent = `BMI: ${bmi.toFixed(1)} - ${category}`;
            
            // Save to history
            const calculation = `Height: ${height * 100}cm, Weight: ${weight}kg = BMI: ${bmi.toFixed(1)} (${category})`;
            saveToHistory('bmi', calculation);
        });
    }
    
    // ===== Hexadecimal Calculator =====
    function initHexCalculator() {
        const decInput = document.getElementById('decimal-value');
        const hexInput = document.getElementById('hex-value');
        const binInput = document.getElementById('binary-value');
        const decToHexBtn = document.getElementById('dec-to-hex');
        const hexToDecBtn = document.getElementById('hex-to-dec');
        const binToDecBtn = document.getElementById('bin-to-dec');
        
        // Decimal to Hex/Binary
        decToHexBtn.addEventListener('click', () => {
            const decimal = parseInt(decInput.value);
            
            if (isNaN(decimal)) {
                alert('Please enter a valid decimal number');
                return;
            }
            
            hexInput.value = decimal.toString(16).toUpperCase();
            binInput.value = decimal.toString(2);
            
            // Save to history
            const calculation = `Decimal ${decimal} = Hex ${hexInput.value}, Binary ${binInput.value}`;
            saveToHistory('hex', calculation);
        });
        
        // Hex to Decimal/Binary
        hexToDecBtn.addEventListener('click', () => {
            const hex = hexInput.value.trim();
            
            if (!hex.match(/^[0-9A-Fa-f]+$/)) {
                alert('Please enter a valid hexadecimal number');
                return;
            }
            
            const decimal = parseInt(hex, 16);
            decInput.value = decimal;
            binInput.value = decimal.toString(2);
            
            // Save to history
            const calculation = `Hex ${hex.toUpperCase()} = Decimal ${decimal}, Binary ${binInput.value}`;
            saveToHistory('hex', calculation);
        });
        
        // Binary to Decimal/Hex
        binToDecBtn.addEventListener('click', () => {
            const binary = binInput.value.trim();
            
            if (!binary.match(/^[01]+$/)) {
                alert('Please enter a valid binary number');
                return;
            }
            
            const decimal = parseInt(binary, 2);
            decInput.value = decimal;
            hexInput.value = decimal.toString(16).toUpperCase();
            
            // Save to history
            const calculation = `Binary ${binary} = Decimal ${decimal}, Hex ${hexInput.value}`;
            saveToHistory('hex', calculation);
        });
    }

    // ===== Loan Calculator =====
    function initLoanCalculator() {
        const loanAmountInput = document.getElementById('loan-amount');
        const interestRateInput = document.getElementById('interest-rate');
        const loanTermInput = document.getElementById('loan-term');
        const calculateBtn = document.getElementById('calculate-loan');
        const resultDiv = document.getElementById('loan-result');
        
        calculateBtn.addEventListener('click', () => {
            const principal = parseFloat(loanAmountInput.value);
            const rate = parseFloat(interestRateInput.value) / 100 / 12; // Monthly interest rate
            const time = parseFloat(loanTermInput.value); // Time in months
            
            if (isNaN(principal) || isNaN(rate) || isNaN(time) || principal <= 0 || rate <= 0 || time <= 0) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            // Calculate EMI using the formula: P * r * (1+r)^n / ((1+r)^n - 1)
            const emi = principal * rate * Math.pow(1 + rate, time) / (Math.pow(1 + rate, time) - 1);
            
            // Calculate total payment and total interest
            const totalPayment = emi * time;
            const totalInterest = totalPayment - principal;
            
            resultDiv.innerHTML = `
                Monthly EMI: $${emi.toFixed(2)}<br>
                Total Payment: $${totalPayment.toFixed(2)}<br>
                Total Interest: $${totalInterest.toFixed(2)}
            `;
            
            // Save to history
            const calculation = `Loan: $${principal}, Rate: ${interestRateInput.value}%, Term: ${time} months = EMI: $${emi.toFixed(2)}`;
            saveToHistory('loan', calculation);
        });
    }
    
    // ===== Ovulation Calculator =====
    function initOvulationCalculator() {
        const lastPeriodInput = document.getElementById('last-period');
        const cycleLengthInput = document.getElementById('cycle-length');
        const calculateBtn = document.getElementById('calculate-ovulation');
        const resultDiv = document.getElementById('ovulation-result');
        
        calculateBtn.addEventListener('click', () => {
            const lastPeriod = new Date(lastPeriodInput.value);
            const cycleLength = parseInt(cycleLengthInput.value);
            
            if (isNaN(lastPeriod.getTime()) || isNaN(cycleLength) || cycleLength < 21 || cycleLength > 35) {
                resultDiv.textContent = 'Please enter valid information';
                return;
            }
            
            // Calculate ovulation date (typically 14 days before the next period)
            const ovulationDate = new Date(lastPeriod);
            ovulationDate.setDate(lastPeriod.getDate() + cycleLength - 14);
            
            // Calculate fertile window (5 days before ovulation + ovulation day)
            const fertileStart = new Date(ovulationDate);
            fertileStart.setDate(ovulationDate.getDate() - 5);
            
            const fertileEnd = new Date(ovulationDate);
            fertileEnd.setDate(ovulationDate.getDate() + 1);
            
            // Calculate next period
            const nextPeriod = new Date(lastPeriod);
            nextPeriod.setDate(lastPeriod.getDate() + cycleLength);
            
            // Format dates
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            
            resultDiv.innerHTML = `
                Estimated Ovulation Date: ${ovulationDate.toLocaleDateString(undefined, options)}<br>
                Fertile Window: ${fertileStart.toLocaleDateString(undefined, options)} to ${fertileEnd.toLocaleDateString(undefined, options)}<br>
                Next Period: ${nextPeriod.toLocaleDateString(undefined, options)}
            `;
            
            // Save to history
            const calculation = `Last Period: ${lastPeriod.toLocaleDateString()}, Cycle: ${cycleLength} days, Ovulation: ${ovulationDate.toLocaleDateString()}`;
            saveToHistory('ovulation', calculation);
        });
    }
    
    // ===== Savings Calculator =====
    function initSavingsCalculator() {
        const principalInput = document.getElementById('principal');
        const monthlyDepositInput = document.getElementById('monthly-deposit');
        const interestInput = document.getElementById('interest');
        const yearsInput = document.getElementById('years');
        const calculateBtn = document.getElementById('calculate-savings');
        const resultDiv = document.getElementById('savings-result');
        
        calculateBtn.addEventListener('click', () => {
            const principal = parseFloat(principalInput.value) || 0;
            const monthlyDeposit = parseFloat(monthlyDepositInput.value) || 0;
            const annualRate = parseFloat(interestInput.value) / 100;
            const years = parseInt(yearsInput.value);
            
            if (isNaN(annualRate) || isNaN(years) || years <= 0) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            // Calculate compound interest
            const monthlyRate = annualRate / 12;
            const totalMonths = years * 12;
            
            let futureValue = principal;
            
            if (monthlyDeposit > 0) {
                // Formula for future value with regular deposits
                // P(1+r)^n + PMT*[((1+r)^n - 1)/r]
                futureValue = principal * Math.pow(1 + monthlyRate, totalMonths) +
                            monthlyDeposit * (Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate;
            } else {
                // Simple compound interest for principal only
                futureValue = principal * Math.pow(1 + monthlyRate, totalMonths);
            }
            
            // Calculate interest earned
            const totalDeposits = principal + (monthlyDeposit * totalMonths);
            const interestEarned = futureValue - totalDeposits;
            
            resultDiv.innerHTML = `
                Future Value: $${futureValue.toFixed(2)}<br>
                Total Deposits: $${totalDeposits.toFixed(2)}<br>
                Interest Earned: $${interestEarned.toFixed(2)}
            `;
            
            // Save to history
            const calculation = `Initial: $${principal}, Monthly: $${monthlyDeposit}, Rate: ${annualRate * 100}%, Years: ${years} = Future Value: $${futureValue.toFixed(2)}`;
            saveToHistory('savings', calculation);
        });
    }

    // ===== Tip Calculator =====
    function initTipCalculator() {
        const billAmountInput = document.getElementById('bill-amount');
        const tipPercentInput = document.getElementById('tip-percentage');
        const numPeopleInput = document.getElementById('num-people');
        const calculateBtn = document.getElementById('calculate-tip');
        const resultDiv = document.getElementById('tip-result');
        
        calculateBtn.addEventListener('click', () => {
            const billAmount = parseFloat(billAmountInput.value);
            const tipPercent = parseFloat(tipPercentInput.value);
            const numPeople = parseInt(numPeopleInput.value) || 1;
            
            if (isNaN(billAmount) || isNaN(tipPercent)) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            const tipAmount = billAmount * (tipPercent / 100);
            const totalAmount = billAmount + tipAmount;
            const perPerson = totalAmount / numPeople;
            
            resultDiv.innerHTML = `
                Tip: $${tipAmount.toFixed(2)} | Total: $${totalAmount.toFixed(2)} | Per Person: $${perPerson.toFixed(2)}
            `;
            
            // Save to history
            const calculation = `Bill: $${billAmount.toFixed(2)}, Tip: ${tipPercent}%, People: ${numPeople} = Per Person: $${perPerson.toFixed(2)}`;
            saveToHistory('tip', calculation);
        });
    }

    // ===== Unit Price Calculator =====
    function initUnitPriceCalculator() {
        const totalPriceInput = document.getElementById('total-price');
        const quantityInput = document.getElementById('quantity');
        const calculateBtn = document.getElementById('calculate-unit-price');
        const resultDiv = document.getElementById('unit-price-result');
        
        calculateBtn.addEventListener('click', () => {
            const totalPrice = parseFloat(totalPriceInput.value);
            const quantity = parseFloat(quantityInput.value);
            
            if (isNaN(totalPrice) || isNaN(quantity) || quantity <= 0) {
                resultDiv.textContent = 'Please enter valid numbers';
                return;
            }
            
            const unitPrice = totalPrice / quantity;
            
            resultDiv.textContent = `Unit Price: $${unitPrice.toFixed(2)}`;
            
            // Save to history
            const calculation = `Total Price: $${totalPrice.toFixed(2)}, Quantity: ${quantity} = Unit Price: $${unitPrice.toFixed(2)}`;
            saveToHistory('unit-price', calculation);
        });
    }

    // ===== World Time Converter =====
    function initWorldTimeConverter() {
        const localTimeInput = document.getElementById('local-time');
        const citySelect = document.getElementById('city-select');
        const calculateBtn = document.getElementById('calculate-time');
        const resultDiv = document.getElementById('time-result');
        
        // Set current date and time
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        
        localTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        
        // Time zone offsets in hours
        const timeZones = {
            'new-york': -5,
            'london': 0,
            'tokyo': 9,
            'sydney': 10,
            'los-angeles': -8,
            'paris': 1,
            'beijing': 8,
            'dubai': 4
        };
        
        calculateBtn.addEventListener('click', () => {
            const localTime = new Date(localTimeInput.value);
            const selectedCity = citySelect.value;
            
            if (isNaN(localTime.getTime())) {
                resultDiv.textContent = 'Please enter a valid date and time';
                return;
            }
            
            // Get the UTC time by adding the local time zone offset
            const utcTime = new Date(localTime.getTime() + localTime.getTimezoneOffset() * 60000);
            
            // Apply the selected city's offset
            const cityOffset = timeZones[selectedCity];
            const cityTime = new Date(utcTime.getTime() + cityOffset * 3600000);
            
            // Format the result
            const cityName = selectedCity.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            
            resultDiv.innerHTML = `
                ${cityName}: ${cityTime.toLocaleString(undefined, options)}
            `;
            
            // Save to history
            const calculation = `Local: ${localTime.toLocaleString()}, ${cityName}: ${cityTime.toLocaleString()}`;
            saveToHistory('world-time', calculation);
        });
    }
}); 