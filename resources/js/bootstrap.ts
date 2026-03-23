import axios from 'axios';
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const pusherKey     = import.meta.env.VITE_PUSHER_APP_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1';

if (pusherKey) {
    window.Pusher = Pusher;

    // Use admin auth endpoint when on admin pages, regular endpoint otherwise
    const isAdminPage = window.location.pathname.startsWith('/admin');

    window.Echo = new Echo({
        broadcaster:  'pusher',
        key:          pusherKey,
        cluster:      pusherCluster,
        forceTLS:     true,
        authEndpoint: isAdminPage ? '/broadcasting/auth/admin' : '/broadcasting/auth',
    });
}
