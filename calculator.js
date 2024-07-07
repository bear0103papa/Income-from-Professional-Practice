document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('calculatorForm');
    const resultDiv = document.getElementById('result');

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const status = document.getElementById('status').value;
        const category = document.getElementById('category').value;
        const healthStatus = document.getElementById('healthStatus').value;
        const amount = parseFloat(document.getElementById('amount').value);

        const result = calculateTax(status, category, healthStatus, amount);

        displayResult(result);
    });

    function calculateTax(status, category, healthStatus, amount) {
        let incomeTaxRate = status === 'resident' ? 0.10 : 0.20;
        let healthInsuranceRate = 0.0211;

        if (category === 'special' && status === 'non-resident' && amount <= 5000) {
            incomeTaxRate = 0;
        }

        if (healthStatus === 'special' || amount < 20000) {
            healthInsuranceRate = 0;
        }

        const incomeTax = amount * incomeTaxRate;
        const healthInsurance = amount * healthInsuranceRate;
        const actualPayment = amount - incomeTax - healthInsurance;

        return {
            income: amount,
            incomeTax: incomeTax,
            healthInsurance: healthInsurance,
            actualPayment: actualPayment
        };
    }

    function displayResult(result) {
        document.getElementById('income').textContent = result.income.toFixed(2);
        document.getElementById('incomeTax').textContent = result.incomeTax.toFixed(2);
        document.getElementById('healthInsurance').textContent = result.healthInsurance.toFixed(2);
        document.getElementById('actualPayment').textContent = result.actualPayment.toFixed(2);

        resultDiv.style.display = 'block';
    }
});
