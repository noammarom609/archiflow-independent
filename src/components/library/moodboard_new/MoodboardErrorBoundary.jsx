import React from 'react';

class MoodboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Moodboard Crashed:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 bg-slate-50 text-center">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-red-100 max-w-md">
            <h2 className="text-xl font-bold text-red-600 mb-2">אופס! משהו השתבש בעורך</h2>
            <p className="text-slate-600 mb-4 text-sm">העורך נתקל בבעיה לא צפויה. הנתונים שלך שמורים.</p>
            <div className="bg-slate-100 p-2 rounded text-left text-xs font-mono text-slate-500 mb-4 overflow-auto max-h-32">
              {this.state.error?.toString()}
            </div>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              נסה שוב
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default MoodboardErrorBoundary;