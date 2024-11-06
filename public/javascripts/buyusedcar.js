let debounceTimeout;

function updateBudgetValue(value) {
    value = Math.max(value, 200000); // Enforce minimum value of 200000
    const budgetRange = document.getElementById('budgetRange');
    const budgetValue = document.getElementById('budgetValue');

    budgetRange.value = value;
    budgetValue.textContent = value;

    

    if (value == 200000) {
        userSetBudget.value = "true"; // Mark that the user has explicitly set the budget to 200000
    } else {
        userSetBudget.value = "false"; // Reset if the value is different
    }

    // Debounce the form submission
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(submitForm, 500); // Adjust delay as needed
}

function submitForm() {
    document.querySelector(".filterForm").submit();
}

function handleSuggestedValueToRange(value) {
    updateBudgetValue(value); // Debounce form submission
}

document.getElementById('budgetRange').addEventListener('input', function () {
    updateBudgetValue(this.value);
});

document.querySelector('.price-cards').addEventListener('click', function (event) {
    const target = event.target;

    if (target.classList.contains('cursor')) {
        document.querySelectorAll('.price-cards .cursor').forEach(card => {
            card.classList.remove('bg-dark', 'text-white', 'transitions');
        });

        handleSuggestedValueToRange(Number(target.dataset.value));
        target.classList.add('bg-dark', 'text-white', 'transitions');
    }
});

// function submitCarBrandForm() {
//     document.querySelector('.filterForm').submit();
// }

// function submitSortByForm(radio) {
//     const selectedLabel = radio.nextElementSibling.innerText;
//     document.getElementById('sortByDropdown').innerText = selectedLabel;
//     document.getElementById('sortby').submit();
// }

function resetFilters() {
    const budgetRange = document.getElementById('budgetRange');
    const budgetValue = document.getElementById('budgetValue');
    // const userSetBudget = document.getElementById('userSetBudget');

    budgetRange.value = 100000;
    budgetValue.textContent = 100000;

    document.querySelectorAll('input[name="carbrand"]').forEach(checkbox => {
        checkbox.checked = false;
    });

    //   Reset sort by options
    document.querySelectorAll('input[name="sortby"]').forEach(radio => {
        radio.checked = false;
    });

    // Update dropdown text for sort by
    // document.getElementById('sortByDropdown').innerText = 'Best Match';

    // Submit the form to reset all filters
    submitForm();
}

function onSearch(input) {
    const textValue = input.value.toUpperCase();
    const allCarBrand = document.querySelectorAll('.carBrandName');

    allCarBrand.forEach(brand => {
        const brandNameInText = brand.innerText.toUpperCase();
        brand.classList.toggle('d-none', !brandNameInText.includes(textValue));
    });
}
