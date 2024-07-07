document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculatorForm');
    const resultDiv = document.getElementById('result');
    const calculationDiv = document.getElementById('calculation');
    const statusSelect = document.getElementById('status');
    const incomeTypeSelect = document.getElementById('incomeType');
    const healthStatusSelect = document.getElementById('healthStatus');
    const specialHealthInfo = document.getElementById('specialHealthInfo');
    const amountInput = document.getElementById('amount');

    const incomeTypes = {
        resident: {
            "薪資-固定薪資": { rate: 0.05, threshold: 40000 },
            "薪資-非固定薪資": { rate: 0.05, threshold: 88501 },
            "佣金": { rate: 0.10, threshold: 20000 },
            "利息": { rate: 0.10, threshold: 20000 },
            "租金": { rate: 0.10, threshold: 20000 },
            "權利金": { rate: 0.10, threshold: 20000 },
            "競技、競賽、機會中獎獎金或給與": { rate: 0.10, threshold: 20000 },
            "政府舉辦獎券中獎獎金": { rate: 0.20, threshold: 5000 },
            "執行業務": { rate: 0.10, threshold: 20000 },
            "退職所得-一次領取": { rate: 0.06, threshold: 33333, special: true },
            "告發或檢舉獎金": { rate: 0.20, threshold: 0 },
            "與證券商或銀行從事結構型商品交易之所得": { rate: 0.10, threshold: 0 }
        },
        "non-resident": {
            "股利": { rate: 0.21, threshold: 0 },
            "薪資": { rate: 0.18, threshold: 0 },
            "佣金": { rate: 0.20, threshold: 0 },
            "利息": { rate: 0.20, threshold: 0 },
            "租金": { rate: 0.20, threshold: 0 },
            "權利金": { rate: 0.20, threshold: 0 },
            "競技、競賽、機會中獎獎金或給與": { rate: 0.20, threshold: 0 },
            "政府舉辦獎券中獎獎金": { rate: 0.20, threshold: 5000 },
            "執行業務": { rate: 0.20, threshold: 0 },
            "個人稿費、版稅、樂譜、作曲、編劇、漫畫、講演之鐘點費": { rate: 0.20, threshold: 5000 },
            "退職所得": { rate: 0.18, threshold: 0 },
            "告發或檢舉獎金": { rate: 0.20, threshold: 0 },
            "與證券商或銀行從事結構型商品交易之所得": { rate: 0.15, threshold: 0 }
        }
    };

    function updateIncomeTypes() {
        const status = statusSelect.value;
        incomeTypeSelect.innerHTML = '';
        Object.keys(incomeTypes[status]).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            incomeTypeSelect.appendChild(option);
        });
    }

    statusSelect.addEventListener('change', updateIncomeTypes);
    updateIncomeTypes();

    healthStatusSelect.addEventListener('change', function() {
        specialHealthInfo.style.display = this.value === 'special' ? 'block' : 'none';
    });

    function calculateTax() {
        const status = statusSelect.value;
        const incomeType = incomeTypeSelect.value;
        const healthStatus = healthStatusSelect.value;
        const amount = parseFloat(amountInput.value);

        if (isNaN(amount)) return;

        const { rate, threshold, special } = incomeTypes[status][incomeType];
        let taxableAmount = 0;
        let tax = 0;
        let healthInsurance = 0;
        let calculationProcess = '';

        calculationProcess += `給付金額: ${amount} 元\n`;
        calculationProcess += `起扣點: ${threshold} 元\n`;
        calculationProcess += `扣繳率: ${rate * 100}%\n\n`;

        if (special && incomeType === "退職所得-一次領取") {
            const years = prompt("請輸入退職服務年資：");
            const limit1 = 188000 * years;
            const limit2 = 377000 * years;

            calculationProcess += `退職服務年資: ${years} 年\n`;
            calculationProcess += `第一級距上限 (188,000 * 年資): ${limit1} 元\n`;
            calculationProcess += `第二級距上限 (377,000 * 年資): ${limit2} 元\n\n`;

            if (amount <= limit1) {
                taxableAmount = 0;
                calculationProcess += `給付金額不超過第一級距上限，免稅\n`;
            } else if (amount <= limit2) {
                taxableAmount = (amount - limit1) / 2;
                calculationProcess += `給付金額超過第一級距但不超過第二級距\n`;
                calculationProcess += `應稅金額 = (給付金額 - 第一級距上限) / 2 = (${amount} - ${limit1}) / 2 = ${taxableAmount} 元\n`;
            } else {
                taxableAmount = (limit2 - limit1) / 2 + (amount - limit2);
                calculationProcess += `給付金額超過第二級距\n`;
                calculationProcess += `應稅金額 = (第二級距上限 - 第一級距上限) / 2 + (給付金額 - 第二級距上限)\n`;
                calculationProcess += `           = (${limit2} - ${limit1}) / 2 + (${amount} - ${limit2}) = ${taxableAmount} 元\n`;
            }
        } else {
            taxableAmount = amount > threshold ? amount : 0;
            if (taxableAmount > 0) {
                calculationProcess += `給付金額超過起扣點，全額計算稅額\n`;
            } else {
                calculationProcess += `給付金額未超過起扣點，免稅\n`;
            }
        }

        tax = taxableAmount * rate;
        calculationProcess += `應扣繳稅額 = ${taxableAmount} * ${rate} = ${tax} 元\n\n`;

        if (healthStatus === 'normal' && amount >= 20000) {
            healthInsurance = amount * 0.0211;
            calculationProcess += `二代健保補充保費 = ${amount} * 2.11% = ${healthInsurance} 元\n`;
        } else {
            calculationProcess += `不需繳納二代健保補充保費\n`;
        }

        const actualPayment = amount - tax - healthInsurance;
        calculationProcess += `\n實際支付金額 = 給付金額 - 應扣繳稅額 - 二代健保補充保費\n`;
        calculationProcess += `                = ${amount} - ${tax} - ${healthInsurance} = ${actualPayment} 元`;

        displayResult({
            income: amount,
            incomeTax: tax,
            healthInsurance: healthInsurance,
            actualPayment: actualPayment
        }, calculationProcess);
    }

    function displayResult(result, calculationProcess) {
        document.getElementById('income').textContent = result.income.toFixed(2);
        document.getElementById('incomeTax').textContent = result.incomeTax.toFixed(2);
        document.getElementById('healthInsurance').textContent = result.healthInsurance.toFixed(2);
        document.getElementById('actualPayment').textContent = result.actualPayment.toFixed(2);

        document.getElementById('calculationProcess').textContent = calculationProcess;

        resultDiv.style.display = 'block';
        calculationDiv.style.display = 'block';
    }

    [statusSelect, incomeTypeSelect, healthStatusSelect, amountInput].forEach(element => {
        element.addEventListener('change', calculateTax);
    });

    amountInput.addEventListener('input', calculateTax);
});
