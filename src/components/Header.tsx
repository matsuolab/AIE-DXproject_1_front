import { GraduationCap, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';

interface HeaderProps {
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function Header({ showBackButton, onBackClick }: HeaderProps) {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBackButton && onBackClick && (
            <Button variant="ghost" onClick={onBackClick} className="mr-2">
              ← 講座一覧に戻る
            </Button>
          )}
          <div className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-blue-600" />
            <span className="text-xl">講義分析システム</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>運営者</span>
          </div>
          <Button variant="ghost" size="sm">
            <LogOut className="h-4 w-4 mr-2" />
            ログアウト
          </Button>
        </div>
      </div>
    </header>
  );
}
