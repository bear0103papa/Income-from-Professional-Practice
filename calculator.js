document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculatorForm');
    const resultDiv = document.getElementById('result');
    const statusSelect = document.getElementById('status');
    const incomeTypeSelect = document.getElementById('incomeType');
    const healthStatusSelect = document.getElementById('healthStatus');
    const specialHealthInfo = document.getElementById('specialHealthInfo');
    const amountInput = document.getElementById('amount');
    const dependentsDiv = document.getElementById('dependentsDiv');
    const dependentsInput = document.getElementById('dependents');
    const amountLabel = document.getElementById('amountLabel');

    const incomeTypes = {
        resident: {
            "薪資-固定薪資（有填免稅額申報表）": { rate: 'progressive', threshold: 0, special: 'progressive' },
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

    function formatNumber(num, isProgressive = false) {
        if (isProgressive) {
            return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        } else {
            return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        }
    }

    function updateIncomeTypes() {
        const status = statusSelect.value;
        incomeTypeSelect.innerHTML = '';
        Object.keys(incomeTypes[status]).forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            incomeTypeSelect.appendChild(option);
        });
        calculateTax();
    }

    function updateAmountLabel() {
        if (incomeTypeSelect.value === "薪資-固定薪資（有填免稅額申報表）") {
            amountLabel.textContent = "員工薪資（月薪）：";
            dependentsDiv.style.display = 'block';
        } else {
            amountLabel.textContent = "給付金額：";
            dependentsDiv.style.display = 'none';
        }
    }

    statusSelect.addEventListener('change', updateIncomeTypes);
    updateIncomeTypes();

    healthStatusSelect.addEventListener('change', function() {
        specialHealthInfo.style.display = this.value === 'special' ? 'block' : 'none';
        calculateTax();
    });

    incomeTypeSelect.addEventListener('change', function() {
        updateAmountLabel();
        calculateTax();
    });

    [amountInput, dependentsInput].forEach(input => {
        input.addEventListener('input', calculateTax);
    });

    amountInput.addEventListener('blur', function() {
        this.value = formatNumber(parseFloat(this.value.replace(/,/g, '')));
    });

    function calculateTax() {
        const status = statusSelect.value;
        const incomeType = incomeTypeSelect.value;
        const healthStatus = healthStatusSelect.value;
        let amount = parseFloat(amountInput.value.replace(/,/g, ''));
        const dependents = parseInt(dependentsInput.value) || 0;

        if (isNaN(amount)) return;

        const { rate, threshold, special } = incomeTypes[status][incomeType];
        let taxableAmount = 0;
        let tax = 0;
        let healthInsurance = 0;

        const isProgressive = incomeType === "薪資-固定薪資（有填免稅額申報表）";

        if (isProgressive) {
            amount *= 12;
            const baseExemption = 97000;
            const totalExemption = baseExemption * (dependents + 1);
            const salaryDeduction = 262000;
            const standardDeduction = 218000;
            let netIncome = amount - totalExemption - salaryDeduction - standardDeduction;

            if (netIncome <= 0) {
                tax = 0;
            } else {
                const taxBrackets = [
                    { limit: 590000, rate: 0.05 },
                    { limit: 1330000, rate: 0.12 },
                    { limit: 2660000, rate: 0.20 },
                    { limit: 4980000, rate: 0.30 },
                    { limit: Infinity, rate: 0.40 }
                ];

                let remainingIncome = netIncome;
                let previousLimit = 0;

                for (let bracket of taxBrackets) {
                    if (remainingIncome > 0) {
                        let taxableInThisBracket = Math.min(remainingIncome, bracket.limit - previousLimit);
                        let taxInThisBracket = taxableInThisBracket * bracket.rate;
                        tax += taxInThisBracket;
                        remainingIncome -= taxableInThisBracket;
                        previousLimit = bracket.limit;
                    } else {
                        break;
                    }
                }

                tax = Math.floor(tax / 10) * 10;
                const monthlyTax = Math.floor(tax / 12 / 10) * 10;
                tax = monthlyTax < 2000 ? 0 : monthlyTax;
            }

            healthInsurance = 0;
        } else if (special === true) {
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
            tax = taxableAmount * rate;
        } else {
            taxableAmount = amount > threshold ? amount : 0;
            if (taxableAmount > 0) {
                tax = taxableAmount * rate;
            }
        }

        if (healthStatus === 'normal' && amount >= 20000 && !isProgressive) {
            healthInsurance = amount * 0.0211;
        }

        const actualPayment = (isProgressive ? amount / 12 : amount) - tax - healthInsurance;

        displayResult({
            income: isProgressive ? amount / 12 : amount,
            incomeTax: tax,
            healthInsurance: healthInsurance,
            actualPayment: actualPayment
        }, isProgressive);
    }

    function displayResult(result, isProgressive) {
        document.getElementById('income').textContent = formatNumber(result.income, isProgressive);
        document.getElementById('incomeTax').textContent = formatNumber(result.incomeTax, isProgressive);
        document.getElementById('healthInsurance').textContent = formatNumber(result.healthInsurance, isProgressive);
        document.getElementById('actualPayment').textContent = formatNumber(result.actualPayment, isProgressive);

        resultDiv.style.display = 'block';
    }

    function generateImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = 800;
        canvas.height = 1000;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = 'white';
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('廖美倫工商記帳士事務所', canvas.width / 2, 50);
        ctx.fillText('各類所得扣繳計算器', canvas.width / 2, 90);

        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        const resultText = [
            `計算所得類別: ${incomeTypeSelect.value}`,
            `身份: ${statusSelect.value}`,
            `健保身份: ${healthStatusSelect.value}`,
            `${amountLabel.textContent} ${amountInput.value}`,
            '',
            '計算結果:',
            `所得金額: ${document.getElementById('income').textContent} 元`,
            `應扣繳稅額: ${document.getElementById('incomeTax').textContent} 元`,
            `二代健保補充保費: ${document.getElementById('healthInsurance').textContent} 元`,
            `實際支付金額: ${document.getElementById('actualPayment').textContent} 元`,
        ];

        resultText.forEach((text, index) => {
            ctx.fillText(text, 50, 150 + index * 30);
        });

        const contactInfo = [
            '我們是一家擁有逾27年豐富經驗，由經過專業執照認證記帳士事務所，',
            '專注於提供高品質的稅務諮詢服務。',
            '無論您計畫成立新公司，或是尋求穩定可信賴的記帳服務，',
            '我們誠摯歡迎您在工作日致電我們進行諮詢。',
            '如需進一步了解我們，請隨時聯繫：',
            '名稱：廖美倫工商記帳士事務所',
            '電話：(03)4596769',
            '',
            '本計算結果僅供參考，實際數字仍以法律依據為主'
        ];

        ctx.font = '18px Arial';
        contactInfo.forEach((line, index) => {
            ctx.fillText(line, 50, 600 + index * 25);
        });

        const imageResult = document.getElementById('imageResult');
        imageResult.innerHTML = '';
        imageResult.appendChild(canvas);
        imageResult.style.display = 'block';
        document.getElementById('downloadBtn').style.display = 'block';
    }

    document.getElementById('generateImageBtn').addEventListener('click', generateImage);

    document.getElementById('downloadBtn').addEventListener('click', function() {
        const canvas = document.querySelector('#imageResult canvas');
        const link = document.createElement('a');
        link.download = '扣繳計算結果.png';
        link.href = canvas.toDataURL();
        link.click();
    });

    updateAmountLabel();
});
