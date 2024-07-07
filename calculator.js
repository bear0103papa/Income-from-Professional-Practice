document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculatorForm');
    const resultDiv = document.getElementById('result');
    const statusSelect = document.getElementById('status');
    const incomeTypeSelect = document.getElementById('incomeType');

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

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const status = statusSelect.value;
        const incomeType = incomeTypeSelect.value;
        const amount = parseFloat(document.getElementById('amount').value);

        const result = calculateTax(status, incomeType, amount);

        displayResult(result);
    });

    function calculateTax(status, incomeType, amount) {
        const { rate, threshold, special } = incomeTypes[status][incomeType];
        let taxableAmount = Math.max(0, amount - threshold);
        let tax = 0;

        if (special && incomeType === "退職所得-一次領取") {
            // 特殊計算方式
            const years = prompt("請輸入退職服務年資：");
            const limit1 = 188000 * years;
            const limit2 = 377000 * years;

            if (amount <= limit1) {
                taxableAmount = 0;
            } else if (amount <= limit2) {
                taxableAmount = (amount - limit1) / 2;
            } else {
                taxableAmount = (limit2 - limit1) / 2 + (amount - limit2);
            }
        }

        tax = taxableAmount * rate;

        return {
            income: amount,
            incomeTax: tax,
            actualPayment: amount - tax
        };
    }

    function displayResult(result) {
        document.getElementById('income').textContent = result.income.toFixed(2);
        document.getElementById('incomeTax').textContent = result.incomeTax.toFixed(2);
        document.getElementById('actualPayment').textContent = result.actualPayment.toFixed(2);

        resultDiv.style.display = 'block';
    }
});
