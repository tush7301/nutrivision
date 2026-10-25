import { Component } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

// Keeps a crash in one page from blanking the whole app.
// Layout keys it by route, so navigating away resets it.
export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error('Page crashed:', error, info.componentStack);
    }

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <div role="alert" className="max-w-md mx-auto mt-16 bg-card-bg border border-border-base rounded-2xl p-8 text-center">
                <AlertCircle size={32} className="mx-auto mb-4 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                <h1 className="text-xl font-semibold text-text-main">This page hit a problem</h1>
                <p className="text-text-muted mt-2">
                    Your logged meals are safe. Reload to try again, or head back home.
                </p>
                <div className="flex justify-center gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-medium py-2 px-5 rounded-full transition-colors"
                    >
                        Reload page
                    </button>
                    <Link
                        to="/home"
                        onClick={() => this.setState({ error: null })}
                        className="py-2 px-5 rounded-full border border-border-base text-text-main hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                    >
                        Go home
                    </Link>
                </div>
            </div>
        );
    }
}
