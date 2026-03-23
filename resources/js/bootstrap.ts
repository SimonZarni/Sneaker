import axios from 'axios';
window.axios = axios;
window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

// ── Laravel Echo + Pusher ─────────────────────────────────────────────────────
// Only initialise Echo when Pusher credentials are configured.
// In local dev without Pusher set up, Echo is simply not initialised
// and the NotificationBell component safely skips subscription.
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

const pusherKey     = import.meta.env.VITE_PUSHER_APP_KEY;
const pusherCluster = import.meta.env.VITE_PUSHER_APP_CLUSTER ?? 'mt1';

if (pusherKey) {
    window.Pusher = Pusher;

    window.Echo = new Echo({
        broadcaster:  'pusher',
        key:          pusherKey,
        cluster:      pusherCluster,
        forceTLS:     true,
        authEndpoint: '/broadcasting/auth',
    });
}
