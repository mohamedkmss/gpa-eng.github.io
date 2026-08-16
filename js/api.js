/**
 * ========================================
 * API.js - التعامل مع واجهات البرمجة
 * ========================================
 * نمط Service Layer - عزل طلبات الشبكة
 */

const API = {
    // إعدادات API
    config: {
        geminiApiKey: '', // يجب تعيينه من قبل المستخدم
        baseURL: 'https://generativelanguage.googleapis.com/v1beta'
    },

    // تهيئة API
    init(apiKey) {
        if (apiKey) {
            this.config.geminiApiKey = apiKey;
        }
        return this;
    },

    // التحقق من وجود المفتاح
    hasApiKey() {
        return !!this.config.geminiApiKey;
    },

    // طلب إلى Gemini API
    async request(prompt, options = {}) {
        if (!this.hasApiKey()) {
            throw new Error('مفتاح API غير موجود. يرجى إدخال مفتاحك الخاص.');
        }

        const url = `${this.config.baseURL}/models/gemini-pro:generateContent?key=${this.config.geminiApiKey}`;
        
        const body = {
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.7,
                topK: options.topK || 40,
                topP: options.topP || 0.95,
                maxOutputTokens: options.maxTokens || 2048,
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'فشل الطلب');
            }

            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        } catch (error) {
            console.error('خطأ في API:', error);
            throw error;
        }
    },

    // تحليل توصيات الذكاء الاصطناعي
    async getRecommendations(courses, gpa) {
        const prompt = `
أنت مستشار أكاديمي ذكي. بناءً على البيانات التالية:
- المعدل الحالي: ${gpa}
- المواد المسجلة: ${JSON.stringify(courses.map(c => ({ name: c.name, grade: c.grade, credits: c.credits })))}

قدم توصيات عملية ومحددة لتحسين الأداء الأكاديمي.
اذكر 3-5 نقاط رئيسية فقط بصيغة واضحة ومباشرة.
        `;

        try {
            const response = await this.request(prompt, { temperature: 0.6 });
            return this.parseRecommendations(response);
        } catch (error) {
            console.error('فشل الحصول على التوصيات:', error);
            return [];
        }
    },

    // تحليل نص التوصيات
    parseRecommendations(text) {
        if (!text) return [];
        
        // تقسيم النص إلى نقاط
        const lines = text.split('\n')
            .filter(line => line.trim().length > 0)
            .filter(line => !line.match(/^\d+\./)) // إزالة الترقيم
            .map(line => line.replace(/^[-*•]\s*/, '').trim());
        
        return lines.slice(0, 5); // الحد الأقصى 5 توصيات
    },

    // حفظ مفتاح API محلياً (اختياري)
    saveApiKey(key) {
        try {
            localStorage.setItem('masarak_api_key', key);
            this.config.geminiApiKey = key;
            return true;
        } catch (error) {
            console.error('فشل حفظ مفتاح API:', error);
            return false;
        }
    },

    // تحميل مفتاح API المحفوظ
    loadApiKey() {
        try {
            const key = localStorage.getItem('masarak_api_key');
            if (key) {
                this.config.geminiApiKey = key;
            }
            return key;
        } catch (error) {
            console.error('فشل تحميل مفتاح API:', error);
            return null;
        }
    },

    // حذف مفتاح API
    clearApiKey() {
        try {
            localStorage.removeItem('masarak_api_key');
            this.config.geminiApiKey = '';
            return true;
        } catch (error) {
            console.error('فشل حذف مفتاح API:', error);
            return false;
        }
    }
};

// تهيئة API
window.appAPI = API;
