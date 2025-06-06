import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';

import { 
    getCurrentTab, 
    getUrlParams,
    getSpotifyVideoId,
    fetchVideosWithBookmarks,
    VideoElementInfo,
    getAllowedUrls,
    ActiveTab,
  } from '../utils'

export interface ChromeContextProps {
  allVideosWithBookmarks: { [key: string]: VideoElementInfo[] };
  allowedUrls: string[];
  curTab: { url: string; id: number };
  curSession: string;
  curVideosWithBookmarks: { [key: string]: VideoElementInfo[] | [] };
}

export const ChromeContext = createContext<ChromeContextProps | undefined>(undefined);


export const ChromeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    const allowedUrls = useMemo(() => getAllowedUrls(), [])

    const [allVideosWithBookmarks, setAllVideosWithBookmarks] = useState<{ [key: string]: VideoElementInfo[] }>({})
    const [curVideosWithBookmarks, setcurVideosWithBookmarks] = useState<{ [key: string]: VideoElementInfo[] | [] }>({ ['unavailable']: [] })
  
    const [curSession, setcurSession] = useState('')
  
    const [curTab, setCurTab] = useState({ url: '', id: 0 })
  
    const fetchCurTab = useCallback(async () => {
      try {
        const tab = await getCurrentTab()
        console.log('CUR TAB CALL', tab)
        return { id: tab.id ?? 0, url: tab.url ?? '' }
      } catch (error) {
        console.error('Error:', error)
        return { url: '', id: 0 }
      }
    }, [])
  
    const fetchCurSession = useCallback(async (tab: ActiveTab): Promise<string> => {
      console.log('CUR SESSION CALL', tab)
      console.log('POPUP - ALLOWED URLS:', allowedUrls, allowedUrls.some(element => tab.url.includes(element)))
  
      let urlParams = getUrlParams(tab.url, allowedUrls)
      try {
        if (urlParams === 'spotify') {
          const spotifyVideoId = await getSpotifyVideoId({ ...tab, id: tab.id })
          urlParams = spotifyVideoId ? spotifyVideoId : ''
          console.log('POPUP - Spotify Video Id:', urlParams)
          urlParams = urlParams.replace('https://open.spotify.com/', '')
        }
        console.log('POPUP - BOOKMARKS:', urlParams)
      } catch (error) {
        console.error('Error:', error)
      }
      return urlParams
    }, [allowedUrls])
  
    const fetchVideos = useCallback(async () => {
      console.log('CURR VIDEOS WITH BOOKMARKS CALL')
      const videos = await fetchVideosWithBookmarks()
      return videos
    }, [])
  
    useEffect(() => {
      fetchCurTab().then((tab) => {
        console.log('TAB', tab)
        setCurTab(tab)
        fetchCurSession(tab).then((session) => {
          console.log('SESSION', session)
          setcurSession(session)
          fetchVideos().then((videos) => {
            console.log('VIDEOS from FETCH', videos)
            const typedVideos = videos as { [key: string]: VideoElementInfo[] | [] };
            if (Object.keys(typedVideos).length === 0) {
              typedVideos[session] = []
            }
            if (typedVideos[session] && typedVideos[session].length === 0) {
              typedVideos[session] = []
            }
  
            console.log('VIDEOS', typedVideos)
            setAllVideosWithBookmarks(videos as { [key: string]: VideoElementInfo[] })
            setcurVideosWithBookmarks(typedVideos)
          })
        })
      })

      const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
        if (areaName === 'sync' && changes[curSession]) {
          const newVideos = changes[curSession].newValue ? JSON.parse(changes[curSession].newValue) : [];
          setcurVideosWithBookmarks((prev) => ({
            ...prev,
            [curSession]: newVideos,
          }));
        }
      };
  
      chrome.storage.onChanged.addListener(handleStorageChange);
  
      return () => {
        chrome.storage.onChanged.removeListener(handleStorageChange);
      };

    }, [fetchVideos, fetchCurSession, fetchCurTab, curTab.id, curSession])
  
    return (
      <ChromeContext.Provider value={{ curTab, curSession, curVideosWithBookmarks, allowedUrls, allVideosWithBookmarks }}>
        {children}
      </ChromeContext.Provider>
    );
  };
