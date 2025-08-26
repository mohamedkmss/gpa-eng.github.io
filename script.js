// Grade points mapping
const gradePoints = {
    'AA': 4.0,
    'A': 3.5,
    'BB': 3.0,
    'B': 2.5,
    'CC': 2.0,
    'C': 1.5,
    'DD': 1.0,
    'D': 0.5,
    'F': 0.0
};

// Array to store subjects
let subjects = [];

// Add subject to the list
function addSubject() {
    const subjectName = document.getElementById('subjectName').value.trim();
    const grade = document.getElementById('grade').value;
    const units = parseInt(document.getElementById('units').value);
    const isRetake = document.getElementById('isRetake').value === 'true';

    // Validation
    if (!subjectName) {
        showError('subjectName', 'يرجى إدخال اسم المادة');
        return;
    }

    if (!grade) {
        showError('grade', 'يرجى اختيار الدرجة');
        return;
    }

    if (!units || units <= 0) {
        showError('units', 'يرجى إدخال عدد وحدات صحيح');
        return;
    }

    // Clear any previous errors
    clearErrors();

    // Calculate points for this subject
    const points = gradePoints[grade] * units;

    // Create subject object
    const subject = {
        id: Date.now(), // Simple ID generation
        name: subjectName,
        grade: grade,
        units: units,
        isRetake: isRetake,
        points: points
    };

    // Add to subjects array
    subjects.push(subject);

    // Update the table
    updateSubjectsTable();

    // Clear form
    clearForm();

    // Show subjects card
    document.getElementById('subjectsCard').style.display = 'block';

    // Smooth scroll to subjects table
    document.getElementById('subjectsCard').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });
}

// Update subjects table
function updateSubjectsTable() {
    const tbody = document.getElementById('subjectsTableBody');
    tbody.innerHTML = '';

    subjects.forEach(subject => {
        const row = document.createElement('tr');
        row.className = 'subject-row';
        row.innerHTML = `
            <td>${subject.name}</td>
            <td>${subject.grade} (${gradePoints[subject.grade]})</td>
            <td>${subject.units}</td>
            <td>${subject.isRetake ? 'معادة' : 'جديدة'}</td>
            <td>${subject.points.toFixed(2)}</td>
            <td>
                <button class="btn btn-danger" onclick="removeSubject(${subject.id})">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Remove subject from list
function removeSubject(id) {
    subjects = subjects.filter(subject => subject.id !== id);
    updateSubjectsTable();
    
    if (subjects.length === 0) {
        document.getElementById('subjectsCard').style.display = 'none';
        document.getElementById('resultsCard').style.display = 'none';
    }
}

// Calculate GPA
function calculateGPA() {
    if (subjects.length === 0) {
        alert('يرجى إضافة مادة واحدة على الأقل');
        return;
    }

    const previousGPA = parseFloat(document.getElementById('previousGPA').value) || 0;
    const previousUnits = parseInt(document.getElementById('previousUnits').value) || 0;

    // Validate previous data
    if (previousGPA < 0 || previousGPA > 4) {
        showError('previousGPA', 'المعدل التراكمي السابق يجب أن يكون بين 0 و 4');
        return;
    }

    if (previousUnits < 0) {
        showError('previousUnits', 'عدد الوحدات السابقة يجب أن يكون أكبر من أو يساوي 0');
        return;
    }

    // Clear any previous errors
    clearErrors();

    // Calculate semester totals
    let semesterPoints = 0;
    let semesterUnits = 0;
    let retakeUnits = 0;

    subjects.forEach(subject => {
        semesterPoints += subject.points;
        semesterUnits += subject.units;
        
        if (subject.isRetake) {
            retakeUnits += subject.units;
        }
    });

    // Calculate semester GPA
    const semesterGPA = semesterUnits > 0 ? semesterPoints / semesterUnits : 0;

    // Calculate cumulative GPA
    // For retaken subjects, we assume they replace the old grades completely
    // So we don't subtract old points, we just add new units to total
    const totalUnits = previousUnits + semesterUnits;
    const totalPoints = (previousGPA * previousUnits) + semesterPoints;
    const cumulativeGPA = totalUnits > 0 ? totalPoints / totalUnits : 0;

    // Display results
    displayResults(semesterGPA, cumulativeGPA, totalUnits, semesterPoints);
}

// Display calculation results
function displayResults(semesterGPA, cumulativeGPA, totalUnits, semesterPoints) {
    document.getElementById('semesterGPA').textContent = semesterGPA.toFixed(2);
    document.getElementById('cumulativeGPA').textContent = cumulativeGPA.toFixed(2);
    document.getElementById('totalUnits').textContent = totalUnits;
    document.getElementById('semesterPoints').textContent = semesterPoints.toFixed(2);

    // Show results card
    document.getElementById('resultsCard').style.display = 'block';

    // Smooth scroll to results
    document.getElementById('resultsCard').scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
    });

    // Add success animation
    const resultItems = document.querySelectorAll('.result-item');
    resultItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.transform = 'scale(1.05)';
            setTimeout(() => {
                item.style.transform = 'scale(1)';
            }, 200);
        }, index * 100);
    });
}

// Clear form inputs
function clearForm() {
    document.getElementById('subjectName').value = '';
    document.getElementById('grade').value = '';
    document.getElementById('units').value = '';
    document.getElementById('isRetake').value = 'false';
}

// Show error message
function showError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add('error');
    
    // Remove existing error message
    const existingError = field.parentNode.querySelector('.error-message');
    if (existingError) {
        existingError.remove();
    }
    
    // Add new error message
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    field.parentNode.appendChild(errorDiv);
    
    // Focus on the field
    field.focus();
}

// Clear all errors
function clearErrors() {
    const errorFields = document.querySelectorAll('.error');
    errorFields.forEach(field => {
        field.classList.remove('error');
    });
    
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(message => {
        message.remove();
    });
}

// Handle Enter key press in form fields
document.addEventListener('DOMContentLoaded', function() {
    const formInputs = document.querySelectorAll('#subjectName, #grade, #units, #isRetake');
    
    formInputs.forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addSubject();
            }
        });
    });

    // Handle university logo error (if image doesn't exist)
    const universityLogo = document.getElementById('universityLogo');
    universityLogo.addEventListener('error', function() {
        // Hide the logo if it doesn't exist
        this.style.display = 'none';
    });

    // Add smooth transitions
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
});

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Set initial card opacity for animation
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    });
});

