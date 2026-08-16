/**
 * ========================================
 * UI.js - إدارة واجهة المستخدم
 * ========================================
 * نمط View Layer - التعامل مع DOM فقط
 */

const UI = {
    // عناصر DOM الرئيسية
    elements: {},

    // تهيئة العناصر
    init() {
        this.elements = {
            coursesList: document.getElementById('courses-list'),
            gpaDisplay: document.getElementById('gpa-display'),
            totalCredits: document.getElementById('total-credits'),
            addCourseBtn: document.getElementById('add-course-btn'),
            clearCoursesBtn: document.getElementById('clear-courses-btn'),
            darkModeToggle: document.getElementById('dark-mode-toggle'),
            toastContainer: document.getElementById('toast-container') || this.createToastContainer()
        };

        return this.elements;
    },

    // إنشاء حاوية الإشعارات إذا لم تكن موجودة
    createToastContainer() {
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
        return container;
    },

    // عرض مادة في القائمة
    renderCourse(course) {
        const courseEl = document.createElement('div');
        courseEl.className = 'card gpu-accelerated';
        courseEl.setAttribute('data-course-id', course.id);
        courseEl.innerHTML = `
            <div class="flex justify-between items-start mb-2">
                <h4 class="font-bold">${course.name || 'مادة غير مسماة'}</h4>
                <button class="btn-ghost delete-course" aria-label="حذف المادة" data-id="${course.id}">
                    <i data-feather="trash-2"></i>
                </button>
            </div>
            <div class="grid grid-2 gap-2">
                <div>
                    <label class="text-sm text-secondary">الدرجة</label>
                    <input type="number" class="grade-input" value="${course.grade || ''}" 
                           min="0" max="100" placeholder="0-100" aria-label="درجة المادة">
                </div>
                <div>
                    <label class="text-sm text-secondary">الساعات</label>
                    <input type="number" class="credits-input" value="${course.credits || ''}" 
                           min="1" max="10" placeholder="عدد الساعات" aria-label="ساعات المادة">
                </div>
            </div>
        `;

        if (this.elements.coursesList) {
            this.elements.coursesList.appendChild(courseEl);
        }

        // تحديث الأيقونات
        if (window.feather) {
            feather.replace();
        }

        return courseEl;
    },

    // إزالة مادة من القائمة
    removeCourse(id) {
        const courseEl = document.querySelector(`[data-course-id="${id}"]`);
        if (courseEl) {
            courseEl.style.animation = 'toast-out 0.3s ease forwards';
            setTimeout(() => courseEl.remove(), 300);
        }
    },

    // تحديث عرض المعدل
    updateGPA(gpa) {
        if (this.elements.gpaDisplay) {
            this.elements.gpaDisplay.textContent = gpa;
            
            // تأثير بصري عند التغيير
            this.elements.gpaDisplay.classList.add('will-animate');
            setTimeout(() => {
                this.elements.gpaDisplay.classList.remove('will-animate');
            }, 300);
        }
    },

    // تحديث عرض الساعات الكلية
    updateTotalCredits(credits) {
        if (this.elements.totalCredits) {
            this.elements.totalCredits.textContent = credits;
        }
    },

    // إظهار إشعار Toast
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <i data-feather="${this.getToastIcon(type)}"></i>
            <span>${message}</span>
        `;

        this.elements.toastContainer.appendChild(toast);

        if (window.feather) {
            feather.replace();
        }

        // إخفاء بعد 3 ثواني
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // الحصول على أيقونة الإشعار
    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || icons.info;
    },

    // إظهار/إخفاء حالة التحميل
    setLoading(isLoading) {
        if (this.elements.addCourseBtn) {
            if (isLoading) {
                this.elements.addCourseBtn.disabled = true;
                this.elements.addCourseBtn.innerHTML = '<span class="spinner"></span> جاري المعالجة...';
            } else {
                this.elements.addCourseBtn.disabled = false;
                this.elements.addCourseBtn.innerHTML = '<i data-feather="plus"></i> إضافة مادة';
                if (window.feather) {
                    feather.replace();
                }
            }
        }
    },

    // تأثير التموج على الأزرار
    addRippleEffect(event) {
        const button = event.currentTarget;
        const ripple = document.createElement('span');
        ripple.className = 'ripple';
        
        const rect = button.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = event.clientX - rect.left - size / 2;
        const y = event.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = `${size}px`;
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        button.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    },

    // التحقق من صحة الإدخال
    validateInput(input, rules) {
        input.classList.remove('input-valid', 'input-invalid');
        
        let isValid = true;
        let message = '';

        if (rules.required && !input.value.trim()) {
            isValid = false;
            message = 'هذا الحقل مطلوب';
        }

        if (rules.min !== undefined && parseFloat(input.value) < rules.min) {
            isValid = false;
            message = `القيمة يجب أن تكون أكبر من ${rules.min}`;
        }

        if (rules.max !== undefined && parseFloat(input.value) > rules.max) {
            isValid = false;
            message = `القيمة يجب أن تكون أقل من ${rules.max}`;
        }

        if (isValid) {
            input.classList.add('input-valid');
        } else {
            input.classList.add('input-invalid');
            this.showToast(message, 'error');
        }

        return isValid;
    },

    // مسح القائمة
    clearCoursesList() {
        if (this.elements.coursesList) {
            const courses = this.elements.coursesList.querySelectorAll('.card');
            courses.forEach((course, index) => {
                setTimeout(() => {
                    course.style.animation = 'toast-out 0.3s ease forwards';
                    setTimeout(() => course.remove(), 300);
                }, index * 50);
            });
        }
    }
};

// تهيئة واجهة المستخدم
window.appUI = UI;
