import { useLocation, Link } from 'react-router-dom';
import { Home, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';

export default function PageNotFound() {
    const location = useLocation();
    const pageName = location.pathname.substring(1);
    
    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background" dir="rtl">
            <div className="max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 */}
                    <div className="space-y-2">
                        <h1 className="text-7xl font-light text-muted-foreground/30">404</h1>
                        <div className="h-0.5 w-16 bg-border mx-auto" />
                    </div>
                    
                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-semibold text-foreground">
                            העמוד לא נמצא
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            העמוד <span className="font-medium text-foreground">"{pageName}"</span> אינו קיים במערכת.
                        </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild>
                            <Link to={createPageUrl('Dashboard')} className="gap-2">
                                <Home className="w-4 h-4" />
                                חזרה לדף הבית
                            </Link>
                        </Button>
                        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
                            <ArrowRight className="w-4 h-4" />
                            חזרה לעמוד הקודם
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
