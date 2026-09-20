import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadCart = useCallback(async () => {
        const token = localStorage.getItem('token');

        if (!token) {
            setCart(null);
            return;
        }

        try {
            const response = await api.get('/cart');
            setCart(response.data);
        } catch (error) {
            console.error('خطا در دریافت سبد خرید:', error);
        }
    }, []);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    const addToCart = async (productId, quantity = 1) => {
        setLoading(true);

        try {
            await api.post('/cart/items', {
                product_id: productId,
                quantity,
            });

            await loadCart();
        } finally {
            setLoading(false);
        }
    };

    // آپدیت خوش‌بینانه: بلافاصله UI رو عوض می‌کنیم، بدون منتظرموندن برای loadCart کامل
    const updateCart = async (itemId, quantity) => {
        const previousCart = cart;

        setCart(prev => {
            if (!prev?.items) return prev;
            return {
                ...prev,
                items: prev.items.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                ),
            };
        });

        try {
            const response = await api.patch(`/cart/items/${itemId}`, { quantity });

            // اگه بک‌اند خودِ سبدِ به‌روزشده رو برمی‌گردونه، جایگزینش کن
            // (اگه فقط پیام موفقیت برمی‌گردونه، این خط رو حذف کن)
            if (response.data?.items) {
                setCart(response.data);
            }
        } catch (error) {
            setCart(previousCart); // اگه خطا خورد، برگرد به حالت قبل
            throw error;
        }
    };

    const removeFromCart = async (itemId) => {
        const previousCart = cart;

        setCart(prev => {
            if (!prev?.items) return prev;
            return {
                ...prev,
                items: prev.items.filter(item => item.id !== itemId),
            };
        });

        try {
            const response = await api.delete(`/cart/items/${itemId}`);

            if (response.data?.items) {
                setCart(response.data);
            }
        } catch (error) {
            setCart(previousCart);
            throw error;
        }
    };

    const cartCount = cart?.items?.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    ) || 0;

    return (
        <CartContext.Provider
            value={{ cart, cartCount, loading, loadCart, addToCart, updateCart, removeFromCart }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart باید داخل CartProvider استفاده شود.');
    }
    return context;
}