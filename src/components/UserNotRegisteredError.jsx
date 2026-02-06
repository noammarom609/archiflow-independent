import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowRight, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '../utils';
import { useAuth } from '@/lib/AuthContext';

const UserNotRegisteredError = () => {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4" dir="rtl">
      <div className="max-w-md w-full p-8 bg-card rounded-2xl shadow-organic-lg border border-border">
        <div className="text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-destructive/10">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>

          {/* Title & Description */}
          <h1 className="text-2xl font-bold text-foreground mb-3">הגישה מוגבלת</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            המשתמש שלך אינו רשום לשימוש במערכת.
            <br />
            פנה למנהל המערכת לקבלת הרשאת גישה.
          </p>

          {/* Help info */}
          <div className="p-4 bg-muted/50 rounded-xl text-sm text-muted-foreground text-right mb-6">
            <p className="font-medium text-foreground mb-2">מה ניתן לעשות:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>ודא שהתחברת עם החשבון הנכון</li>
              <li>פנה למנהל המערכת לקבלת גישה</li>
              <li>נסה להתנתק ולהתחבר מחדש</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              variant="outline"
              onClick={() => logout()}
              className="w-full gap-2"
            >
              <LogOut className="w-4 h-4" />
              התנתק ונסה שוב
            </Button>
            <Button
              variant="ghost"
              asChild
              className="w-full text-muted-foreground hover:text-foreground gap-2"
            >
              <Link to={createPageUrl('LandingHome')}>
                <ArrowRight className="w-4 h-4" />
                חזרה לדף הבית
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} ArchiFlow Systems
      </div>
    </div>
  );
};

export default UserNotRegisteredError;
