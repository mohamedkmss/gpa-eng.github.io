/**
 * ========================================
 * App.js - نقطة الدخول الرئيسية للتطبيق
 * ========================================
 * نمط Controller - تنسيق بين Store و UI و API
 */

const App = {
    // تهيئة التطبيق
    async init() {
        console.log('🚀 جاري تهيئة التطبيق...');

        try {
            // 1. تهيئة واجهة المستخدم
            UI.init();
            
            // 2. تحميل مفتاح API إذا وجد
            const savedApiKey = API.loadApiKey();
            if (savedApiKey) {
                API.init(savedApiKey);
            }

            // 3. الاشتراك في تغييرات الحالة
            appStore.subscribe(this.handleStateChange.bind(this));

            // 4. ربط الأحداث
            this.bindEvents();

            // 5. تطبيق الإعدادات المحفوظة
            appStore.applySettings();

            // 6. عرض المواد المحفوظة
            this.renderSavedCourses();

            // 7. تحديث الإحصائيات
            this.updateStats();

            console.log('✅ التطبيق جاهز!');
            
        } catch (error) {
            console.error('❌ فشل تهيئة التطبيق:', error);
            UI.showToast('حدث خطأ أثناء تحميل التطبيق', 'error');
        }
    },

    // ربط الأحداث
    bindEvents() {
        // زر إضافة مادة
        const addBtn = document.getElementById('add-course-btn');
        if (addBtn) {
            addBtn.addEventListener('click', this.handleAddCourse.bind(this));
            addBtn.addEventListener('click', UI.addRippleEffect);
        }

        // زر مسح جميع المواد
        const clearBtn = document.getElementById('clear-courses-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', this.handleClearCourses.bind(this));
        }

        // زر الوضع الليلي
        const darkModeBtn = document.getElementById('dark-mode-toggle');
        if (darkModeBtn) {
            darkModeBtn.addEventListener('click', this.toggleDarkMode.bind(this));
        }

        // تفويض الأحداث للقائمة الديناميكية
        const coursesList = document.getElementById('courses-list');
        if (coursesList) {
            coursesList.addEventListener('click', this.handleCourseListClick.bind(this));
            coursesList.addEventListener('input', this.handleCourseInputChange.bind(this));
        }

        // دعم لوحة المفاتيح
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
    },

    // معالجة إضافة مادة جديدة
    handleAddCourse(event) {
        event.preventDefault();

        // الحصول على بيانات المادة من النموذج
        const courseForm = document.getElementById('course-form');
        if (!courseForm) return;

        const formData = new FormData(courseForm);
        const course = {
            name: formData.get('course-name')?.trim() || '',
            grade: parseFloat(formData.get('course-grade')) || 0,
            credits: parseInt(formData.get('course-credits')) || 3,
            type: formData.get('course-type') || 'theoretical'
        };

        // التحقق من صحة البيانات
        if (!course.name) {
            UI.showToast('يرجى إدخال اسم المادة', 'error');
            return;
        }

        if (course.grade < 0 || course.grade > 100) {
            UI.showToast('الدرجة يجب أن تكون بين 0 و 100', 'error');
            return;
        }

        if (course.credits < 1 || course.credits > 10) {
            UI.showToast('الساعات يجب أن تكون بين 1 و 10', 'error');
            return;
        }

        // إضافة المادة للمتجر
        const id = appStore.addCourse(course);
        
        // عرض المادة في الواجهة
        const courseEl = UI.renderCourse({ ...course, id });
        
        // تأثير حركي عند الإضافة
        courseEl.style.animation = 'toast-in 0.3s ease';

        // تحديث الإحصائيات
        this.updateStats();

        // إشعار النجاح
        UI.showToast('تمت إضافة المادة بنجاح', 'success');

        // تصفير النموذج
        courseForm.reset();
    },

    // معالجة النقرات في قائمة المواد
    handleCourseListClick(event) {
        const deleteBtn = event.target.closest('.delete-course');
        if (deleteBtn) {
            const courseId = deleteBtn.dataset.id;
            this.handleDeleteCourse(courseId);
        }
    },

    // معالجة حذف مادة
    handleDeleteCourse(id) {
        if (!id) return;

        // تأكيد الحذف
        if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) {
            return;
        }

        // حذف من المتجر
        appStore.removeCourse(id);

        // حذف من الواجهة
        UI.removeCourse(id);

        // تحديث الإحصائيات
        this.updateStats();

        UI.showToast('تم حذف المادة', 'info');
    },

    // معالجة التغييرات في حقول المادة
    handleCourseInputChange(event) {
        const input = event.target;
        const courseCard = input.closest('.card');
        if (!courseCard) return;

        const courseId = courseCard.dataset.courseId;
        const gradeInput = courseCard.querySelector('.grade-input');
        const creditsInput = courseCard.querySelector('.credits-input');

        if (!courseId || !gradeInput || !creditsInput) return;

        // تحديث المادة في المتجر
        appStore.updateCourse(courseId, {
            grade: parseFloat(gradeInput.value) || 0,
            credits: parseInt(creditsInput.value) || 3
        });

        // تحديث الإحصائيات
        this.updateStats();
    },

    // معالجة مسح جميع المواد
    handleClearCourses() {
        if (!appStore.courses || appStore.courses.length === 0) {
            UI.showToast('لا توجد مواد لحذفها', 'warning');
            return;
        }

        if (!confirm('هل أنت متأكد من حذف جميع المواد؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }

        // مسح من المتجر
        appStore.clearCourses();

        // مسح من الواجهة
        UI.clearCoursesList();

        // تحديث الإحصائيات
        this.updateStats();

        UI.showToast('تم حذف جميع المواد', 'info');
    },

    // تبديل الوضع الليلي
    toggleDarkMode() {
        const isDark = !appStore.settings.darkMode;
        appStore.updateSetting('darkMode', isDark);
        
        UI.showToast(isDark ? 'تم تفعيل الوضع الليلي' : 'تم تعطيل الوضع الليلي', 'info');
    },

    // معالجة التغييرات في الحالة
    handleStateChange(key, newValue, oldValue) {
        console.log(`تغيير في ${key}:`, { oldValue, newValue });

        if (key === 'courses') {
            this.updateStats();
        }
    },

    // عرض المواد المحفوظة عند التحميل
    renderSavedCourses() {
        const courses = appStore.courses || [];
        if (!courses.length) return;

        courses.forEach(course => {
            UI.renderCourse(course);
        });
    },

    // تحديث الإحصائيات والمعدل
    updateStats() {
        const gpa = appStore.calculateGPA();
        const totalCredits = (appStore.courses || []).reduce((sum, c) => sum + (c.credits || 0), 0);

        UI.updateGPA(gpa);
        UI.updateTotalCredits(totalCredits);

        // تحديث الرسم البياني إذا وجد
        this.updateChart(gpa, totalCredits);
    },

    // تحديث الرسم البياني
    updateChart(gpa, credits) {
        const chartElement = document.getElementById('gpa-chart');
        if (!chartElement || !window.Chart) return;

        const ctx = chartElement.getContext('2d');
        
        // تدمير الرسم القديم إذا وجد
        if (this.gpaChart) {
            this.gpaChart.destroy();
        }

        // إنشاء رسم جديد
        this.gpaChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['المعدل الحالي', 'الهدف (4.0)'],
                datasets: [{
                    data: [parseFloat(gpa), (4.0 - parseFloat(gpa)).toFixed(2)],
                    backgroundColor: ['#007aff', 'rgba(0, 122, 255, 0.2)'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true
                    }
                },
                cutout: '70%'
            }
        });
    },

    // معالجة لوحة المفاتيح
    handleKeyboard(event) {
        // Escape لإغلاق النوافذ المنبثقة
        if (event.key === 'Escape') {
            // إغلاق أي نوافذ منبثقة مفتوحة
            const modals = document.querySelectorAll('.modal[aria-hidden="false"]');
            modals.forEach(modal => modal.classList.add('hidden'));
        }

        // Ctrl+S للحفظ السريع
        if (event.ctrlKey && event.key === 's') {
            event.preventDefault();
            UI.showToast('تم الحفظ تلقائياً', 'success');
        }
    }
};

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// تصدير الكائنات العامة
window.app = App;
