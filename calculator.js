document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculatorForm');
    const resultDiv = document.getElementById('result');
    const calculationDiv = document.getElementById('calculation');
    const statusSelect = document.getElementById('status');
    const incomeTypeSelect = document.getElementById('incomeType');
    const healthStatusSelect = document.getElementById('healthStatus');
    const specialHealthInfo = document.getElementById('specialHealthInfo');
    const amountInput = document.getElementById('amount');
    const dependentsDiv = document.getElementById('dependentsDiv');
    const dependentsInput = document.getElementById('dependents');
    const amountLabel = document.getElementById('amountLabel');
    const calculateBtn = document.getElementById('calculateBtn');

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
    });

    incomeTypeSelect.addEventListener('change', updateAmountLabel);

    amountInput.addEventListener('blur', function() {
        this.value = formatNumber(parseFloat(this.value.replace(/,/g, '')));
    });

    calculateBtn.addEventListener('click', calculateTax);

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
        let calculationProcess = '';

        const isProgressive = incomeType === "薪資-固定薪資（有填免稅額申報表）";

        if (isProgressive) {
            calculationProcess += `員工薪資（月薪）: ${formatNumber(amount, true)} 元\n`;
            amount *= 12;
            calculationProcess += `年薪 (月薪 * 12): ${formatNumber(amount, true)} 元\n\n`;
        } else {
            calculationProcess += `給付金額: ${formatNumber(amount)} 元\n`;
        }

        if (special === 'progressive') {
            const baseExemption = 97000;
            const totalExemption = baseExemption * (dependents + 1);
            const salaryDeduction = 262000;
            const standardDeduction = 218000;
            let netIncome = amount - totalExemption - salaryDeduction - standardDeduction;

            calculationProcess += `計算應稅所得淨額:\n`;
            calculationProcess += `受扶養親屬人數: ${dependents}\n`;
            calculationProcess += `總免稅額: ${formatNumber(baseExemption, true)} * (${dependents} + 1) = ${formatNumber(totalExemption, true)} 元\n`;
            calculationProcess += `年薪 - 總免稅額 - 薪資扣除額 - 標準扣除額\n`;
            calculationProcess += `${formatNumber(amount, true)} - ${formatNumber(totalExemption, true)} - ${formatNumber(salaryDeduction, true)} - ${formatNumber(standardDeduction, true)} = ${formatNumber(netIncome, true)} 元\n\n`;

            if (netIncome <= 0) {
                tax = 0;
                calculationProcess += `應稅所得淨額為負數或零，無需繳稅\n`;
            } else {
                calculationProcess += `採用累進稅率計算稅額:\n`;
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

                        calculationProcess += `${formatNumber(previousLimit, true)} 到 ${formatNumber(bracket.limit, true)} 之間的所得: ${formatNumber(taxableInThisBracket, true)} 元, 稅率 ${bracket.rate * 100}%, 稅額 ${formatNumber(taxInThisBracket, true)} 元\n`;

                        remainingIncome -= taxableInThisBracket;
                        previousLimit = bracket.limit;
                    } else {
                        break;
                    }
                }

                // 完全捨棄法至十位數
                tax = Math.floor(tax / 10) * 10;
                calculationProcess += `\n年度稅額 (完全捨棄法至十位數): ${formatNumber(tax, true)} 元\n`;

                // 計算月平均稅額
                const monthlyTax = Math.floor(tax / 12 / 10) * 10; // 完全捨去法至十位數
                calculationProcess += `月平均應扣稅額: ${formatNumber(monthlyTax, true)} 元\n`;
                tax = monthlyTax < 2000 ? 0 : monthlyTax;
                calculationProcess += `最終應扣稅額: ${formatNumber(tax, true)} 元\n`;
            }

            // 薪資-固定薪資（有填免稅額申報表）項目的二代健保補充保費為0
            healthInsurance = 0;
            calculationProcess += `\n薪資-固定薪資（有填免稅額申報表）項目不需繳納二代健保補充保費\n`;
        } else if (special === true) {
            // 處理退職所得-一次領取的特殊情況
            const years = prompt("請輸入退職服務年資：");
            const limit1 = 188000 * years;
            const limit2 = 377000 * years;

            calculationProcess += `退職服務年資: ${years} 年\n`;
            calculationProcess += `第一級距上限 (188,000 * 年資): ${formatNumber(limit1)} 元\n`;
            calculationProcess += `第二級距上限 (377,000 * 年資): ${formatNumber(limit2)} 元\n\n`;

            if (amount <= limit1) {
                taxableAmount = 0;
                calculationProcess += `給付金額不超過第一級距上限，免稅\n`;
            } else if (amount <= limit2) {
                taxableAmount = (amount - limit1) / 2;
                calculationProcess += `給付金額超過第一級距但不超過第二級距\n`;
                calculationProcess += `應稅金額 = (給付金額 - 第一級距上限) / 2 = (${formatNumber(amount)} - ${formatNumber(limit1)}) / 2 = ${formatNumber(taxableAmount)} 元\n`;
            } else {
                taxableAmount = (limit2 - limit1) / 2 + (amount - limit2);
                calculationProcess += `給付金額超過第二級距\n`;
                calculationProcess += `應稅金額 = (第二級距上限 - 第一級距上限) / 2 + (給付金額 - 第二級距上限)\n`;
                calculationProcess += `           = (${formatNumber(limit2)} - ${formatNumber(limit1)}) / 2 + (${formatNumber(amount)} - ${formatNumber(limit2)}) = ${formatNumber(taxableAmount)} 元\n`;
            }
            tax = taxableAmount * rate;
        } else {
            taxableAmount = amount > threshold ? amount : 0;
            if (taxableAmount > 0) {
                calculationProcess += `給付金額超過起扣點 ${formatNumber(threshold)} 元，全額計算稅額\n`;
                tax = taxableAmount * rate;
            } else {
                calculationProcess += `給付金額未超過起扣點 ${formatNumber(threshold)} 元，免稅\n`;
            }
        }

        if (!special) {
            calculationProcess += `應扣繳稅額 = ${formatNumber(taxableAmount)} * ${rate} = ${formatNumber(tax)} 元\n`;
        }

        // 計算二代健保補充保費
        if (healthStatus === 'normal' && amount >= 20000 && !isProgressive) {
            healthInsurance = amount * 0.0211;
            calculationProcess += `\n二代健保補充保費 = ${formatNumber(amount)} * 2.11% = ${formatNumber(healthInsurance)} 元\n`;
        } else {
            calculationProcess += `\n不需繳納二代健保補充保費\n`;
        }

        const actualPayment = (isProgressive ? amount / 12 : amount) - tax - healthInsurance;
        calculationProcess += `\n實際支付金額 = ${isProgressive ? "月薪" : "給付金額"} - 應扣繳稅額 - 二代健保補充保費\n`;
        calculationProcess += `                = ${formatNumber(isProgressive ? amount / 12 : amount, isProgressive)} - ${formatNumber(tax, isProgressive)} - ${formatNumber(healthInsurance, isProgressive)} = ${formatNumber(actualPayment, isProgressive)} 元`;

        displayResult({
            income: isProgressive ? amount / 12 : amount,
            incomeTax: tax,
            healthInsurance: healthInsurance,
            actualPayment: actualPayment
        }, calculationProcess, isProgressive);

        generateImage();
    }

    function displayResult(result, calculationProcess, isProgressive) {
        document.getElementById('income').textContent = formatNumber(result.income, isProgressive);
        document.getElementById('incomeTax').textContent = formatNumber(result.incomeTax, isProgressive);
        document.getElementById('healthInsurance').textContent = formatNumber(result.healthInsurance, isProgressive);
        document.getElementById('actualPayment').textContent = formatNumber(result.actualPayment, isProgressive);

        document.getElementById('calculationProcess').textContent = calculationProcess;

        resultDiv.style.display = 'block';
        calculationDiv.style.display = 'block';
    }

  function generateImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 設置畫布大小
        canvas.width = 800;
        canvas.height = 1200;

        // 繪製背景
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 繪製星星
        for (let i = 0; i < 200; i++) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 設置文字樣式
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';

        // 繪製標題
        ctx.font = '32px Arial';
        ctx.fillText('廖美倫工商記帳士事務所', canvas.width / 2, 50);
        ctx.fillText('各類所得扣繳計算器', canvas.width / 2, 90);

        // 繪製計算結果
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

        // 繪製計算過程
        const process = document.getElementById('calculationProcess').textContent.split('\n');
        process.forEach((line, index) => {
            ctx.fillText(line, 50, 450 + index * 25);
        });

        // 繪製聯絡資訊
        const contactInfo = [
            '我們是一家擁有逾27年豐富經驗，由經過專業執照認證記帳士事務所，',
            '專注於提供高品質的稅務諮詢服務。',
            '無論您計畫成立新公司，或是尋求穩定可信賴的記帳服務，',
            '我們誠摯歡迎您在工作日致電我們進行諮詢。',
            '如需進一步了解我們，請隨時聯繫：',
            '名稱：廖美倫工商記帳士事務所',
            '電話：(03)4596769'
        ];

        ctx.font = '18px Arial';
        contactInfo.forEach((line, index) => {
            ctx.fillText(line, 50, 1000 + index * 25);
        });

        // 顯示圖片
        const imageResult = document.getElementById('imageResult');
        imageResult.innerHTML = '';
        imageResult.appendChild(canvas);
        imageResult.style.display = 'block';
    }

    updateAmountLabel();
});
