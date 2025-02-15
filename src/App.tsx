import appLogo from '.assets/bookmark64x64.png'
import './App.css'

import { 
  getCurrentTab, 
  localizeContent, 
  fetchAllowedUrls 
} from './utils'

function App() {

  
  
  return (
    <>
      <div id="extensionName" className="title">
        <span data-i18n="extensionName"></span>
      </div>
      <div id="container" className="container">
          <div>
              <div id="videos" className="videoslist">
                  <span className="title" data-i18n="videosSelectTitle"></span>
                  <select id="dropdown" className="videosSelect" i18n-title="videosSelectTitle">
                  
                  </select>
              </div>
              <div id="setUpListContainer" className="setUpButtonContainer">
                  
              </div>
              <div id="sliderContainer" className="sliderContainer">

              </div>
              <div id="listTitle" className="title"></div>
              <div className="bookmarks" id="bookmarks"></div>
          </div>
      </div>
    </>
  )
}

export default App
