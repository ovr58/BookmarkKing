import { useEffect, useState } from 'react';

const useTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const getThemeLocalStorage = async () => {
        const theme = await chrome.storage.sync.get('curTheme');
        console.log('THEME IN STORAGE:', theme);
        if (theme) {
        return theme.curTheme as unknown as 'light' | 'dark';
        }
        return null;
    };

  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    
    getThemeLocalStorage().then((theme) => {
      console.log('THEME:', theme);
        if (theme) {
            setTheme(theme);
        } else {
            setTheme(matchMedia.matches ? 'dark' : 'light');
        }
    }).catch((error) => {
        console.error('Error:', error);
        setTheme(matchMedia.matches ? 'dark' : 'light');
    }
    ); 
    const handleStorageChange = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.curTheme) {
          setTheme(changes.curTheme.newValue);
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    // Убираем слушатель при размонтировании
    return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return theme;
};

export default useTheme;