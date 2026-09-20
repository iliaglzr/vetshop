import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadCart = async () => {
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
    };

    useEffect(() => {
        loadCart();
    }, []);

    const addToCart = async (productId, quantity = 1) => {
        setLoading(true);

        try {
            await api.post('/cart/items', {
                product_id: productId,
                quantity,
            });

            // بلافاصله سبد را دوباره می‌گیریم
            await loadCart();

        } finally {
            setLoading(false);
        }
    };

    const updateCart = async (itemId, quantity) => {
        await api.patch(`/cart/items/${itemId}`, {
            quantity,
        });

        await loadCart();
    };

    const removeFromCart = async (itemId) => {
        await api.delete(`/cart/items/${itemId}`);

        await loadCart();
    };

    const cartCount = cart?.items?.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
    ) || 0;

    return (
        <CartContext.Provider
            value={{
                cart,
                cartCount,
                loading,
                loadCart,
                addToCart,
                updateCart,
                removeFromCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error(
            'useCart باید داخل CartProvider استفاده شود.'
        );
    }

    return context;
}