/**
 * ========================================
 * Store.js - إدارة حالة التطبيق المركزية
 * ========================================
 * نمط State Management باستخدام Proxy
 */

const Store = {
    // الحالة الأولية
    _state: {
        courses: [],
        semesters: [],
        currentSemester: null,
        settings: {
            darkMode: false,
            highContrast: false,
            reducedMotion: false
        },
        ui: {
            loading: false,
            toast: null
        }
    },

    // المستمعون للتغييرات
    _listeners: new Set(),

    // إنشاء Proxy لمراقبة التغييرات
    _proxy: null,

    init() {
        this._proxy = new Proxy(this._state, {
            set: (target, key, value) => {
                const oldValue = target[key];
                target[key] = value;
                
                // إشعار المستمعين بالتغيير
                this._notify(key, value, oldValue);
                
                // حفظ في localStorage إذا لزم الأمر
                if (['courses', 'semesters', 'settings'].includes(key)) {
                    this._save();
                }
                
                return true;
            },

            get: (target, key) => {
                return target[key];
            }
        });

        // تحميل البيانات المحفوظة
        this._load();
        
        return this._proxy;
    },

    // إضافة مستمع للتغييرات
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    },

    // إشعار جميع المستمعين
    _notify(key, newValue, oldValue) {
        this._listeners.forEach(callback => {
            callback(key, newValue, oldValue);
        });
    },

    // حفظ الحالة في localStorage
    _save() {
        try {
            localStorage.setItem('masarak_state', JSON.stringify({
                courses: this._state.courses,
                semesters: this._state.semesters,
                settings: this._state.settings
            }));
        } catch (error) {
            console.error('فشل حفظ البيانات:', error);
        }
    },

    // تحميل الحالة من localStorage
    _load() {
        try {
            const saved = localStorage.getItem('masarak_state');
            if (saved) {
                const parsed = JSON.parse(saved);
                this._state.courses = parsed.courses || [];
                this._state.semesters = parsed.semesters || [];
                this._state.settings = parsed.settings || this._state.settings;
                
                // تطبيق الإعدادات المحفوظة
                this.applySettings();
            }
        } catch (error) {
            console.error('فشل تحميل البيانات:', error);
        }
    },

    // تطبيق الإعدادات
    applySettings() {
        const { darkMode, highContrast, reducedMotion } = this._state.settings;
        
        document.documentElement.classList.toggle('dark', darkMode);
        document.documentElement.classList.toggle('high-contrast', highContrast);
        
        if (reducedMotion) {
            document.documentElement.style.setProperty('--t-fast', '0.01ms');
            document.documentElement.style.setProperty('--t-base', '0.01ms');
            document.documentElement.style.setProperty('--t-slow', '0.01ms');
        }
    },

    // تحديث الإعدادات
    updateSetting(key, value) {
        this._state.settings[key] = value;
        this.applySettings();
    },

    // إضافة مادة
    addCourse(course) {
        const id = Date.now().toString(36) + Math.random().toString(36).substr(2);
        this._state.courses.push({ ...course, id });
        return id;
    },

    // حذف مادة
    removeCourse(id) {
        this._state.courses = this._state.courses.filter(c => c.id !== id);
    },

    // تحديث مادة
    updateCourse(id, updates) {
        const index = this._state.courses.findIndex(c => c.id === id);
        if (index !== -1) {
            this._state.courses[index] = { ...this._state.courses[index], ...updates };
        }
    },

    // مسح جميع المواد
    clearCourses() {
        this._state.courses = [];
    },

    // حساب المعدل
    calculateGPA() {
        const totalCredits = this._state.courses.reduce((sum, c) => sum + (c.credits || 0), 0);
        const totalPoints = this._state.courses.reduce((sum, c) => {
            const grade = c.grade || 0;
            const credits = c.credits || 0;
            return sum + (grade * credits);
        }, 0);

        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    }
};

// تهيئة المتجر وتصديره
window.appStore = Store.init();
