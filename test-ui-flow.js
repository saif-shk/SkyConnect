const puppeteer = require('puppeteer');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/Asus/.gemini/antigravity/brain/c58d4817-2495-49a8-8197-3c8950716f36';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const run = async () => {
  console.log('🏁 Launching headless browser with fake WebRTC audio/video device options...');
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });

  let page;
  try {
    page = await browser.newPage();
    
    // Redirect console logs from browser to node console for debugging
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    console.log('\n🌐 1. Navigating to authentication page...');
    await page.goto('http://localhost:3000/auth', { waitUntil: 'networkidle2' });
    await delay(1000);

    console.log('📝 2. Selecting Sign Up tab and entering details...');
    await page.waitForSelector('[data-testid="signup-tab"]');
    await page.click('[data-testid="signup-tab"]');
    await delay(500);

    await page.type('[data-testid="signup-name-input"]', 'Saif');
    await page.type('[data-testid="signup-username-input"]', `saif_${Math.floor(Math.random() * 10000)}`);
    await page.type('[data-testid="signup-password-input"]', 'password123');

    console.log('✉️ 3. Registering account...');
    await page.click('[data-testid="auth-submit-btn"]');
    
    console.log('Waiting for automatic redirection to signin tab...');
    await page.waitForSelector('[data-testid="signin-password-input"]', { timeout: 10000 });

    console.log('🔑 4. Entering credentials and signing in...');
    // Username input will already contain the username since it persists in state
    await page.click('[data-testid="signin-password-input"]');
    await page.type('[data-testid="signin-password-input"]', 'password123');
    
    await page.click('[data-testid="auth-submit-btn"]');
    
    console.log('🏠 5. Waiting for redirection to Home Page...');
    await page.waitForSelector('[data-testid="create-new-meeting-btn"]', { timeout: 10000 });
    await delay(1000);
    
    const homeScreenshotPath = path.join(ARTIFACTS_DIR, 'home_screenshot.png');
    await page.screenshot({ path: homeScreenshotPath });
    console.log('📸 Saved Home page screenshot to:', homeScreenshotPath);

    console.log('➕ 6. Triggering Create New Meeting...');
    await page.click('[data-testid="create-new-meeting-btn"]');
    
    console.log('🎥 7. Waiting for Video Call Lobby to render...');
    await page.waitForSelector('input[placeholder="Your name"]', { timeout: 10000 });
    await delay(1500); // Allow camera dummy stream to initialize

    console.log('🗣️ 8. Entering name and joining meeting...');
    await page.type('input[placeholder="Your name"]', 'Saif');
    await delay(500);
    
    // Click join button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const joinBtn = buttons.find(b => b.textContent.includes('Join Meeting') || b.textContent.includes('Connecting'));
      if (joinBtn) joinBtn.click();
    });
    
    await delay(4000); // Wait for WebRTC connections and Socket joins to finalize
    
    const meetingScreenshotPath = path.join(ARTIFACTS_DIR, 'meeting_screenshot.png');
    await page.screenshot({ path: meetingScreenshotPath });
    console.log('📸 Saved Call Room screenshot to:', meetingScreenshotPath);

    console.log('📌 9. Testing Micro-Note Pinning...');
    // Click Pin Note button in header
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const pinBtn = buttons.find(b => b.textContent.includes('Pin Note'));
      if (pinBtn) pinBtn.click();
    });
    
    await page.waitForSelector('input[placeholder="e.g., Break at 4 PM"]');
    await delay(500);
    
    // Type a valid note of exactly 12 words (limit is 10-20 words)
    const noteText = 'Please note that the meeting is currently active and screen sharing works';
    await page.type('input[placeholder="e.g., Break at 4 PM"]', noteText);
    await delay(500);
    
    // Click the Pin Note submit button
    await page.evaluate(() => {
      const modal = document.querySelector('div[style*="rgba(0, 0, 0, 0.7)"]');
      if (modal) {
        const pinBtn = Array.from(modal.querySelectorAll('button')).find(b => b.textContent.includes('Pin Note'));
        if (pinBtn) pinBtn.click();
      }
    });
    
    await delay(2000); // Wait for note to render
    const noteScreenshotPath = path.join(ARTIFACTS_DIR, 'note_pinned_screenshot.png');
    await page.screenshot({ path: noteScreenshotPath });
    console.log('📸 Saved Pinned Note screenshot to:', noteScreenshotPath);

    console.log('📊 10. Testing Host Engagement Analytics Dashboard...');
    // Click Analytics button in header
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const analyticsBtn = buttons.find(b => b.textContent.includes('Analytics'));
      if (analyticsBtn) analyticsBtn.click();
    });
    
    await delay(2000); // Wait for analytics panel transition
    const analyticsScreenshotPath = path.join(ARTIFACTS_DIR, 'analytics_screenshot.png');
    await page.screenshot({ path: analyticsScreenshotPath });
    console.log('📸 Saved Analytics screenshot to:', analyticsScreenshotPath);

    console.log('💬 11. Testing Text Chat panel and messaging...');
    // Close analytics first
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const closeBtn = buttons.find(b => b.title === 'Close' || b.textContent.includes('Analytics'));
      if (closeBtn) closeBtn.click();
    });
    await delay(500);

    // Open chat using bottom control bar button containing MessageCircle
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const chatBtn = buttons.find(b => b.querySelector('svg.lucide-message-circle'));
      if (chatBtn) chatBtn.click();
    });
    
    await page.waitForSelector('input[placeholder="Type a message..."]');
    await delay(500);
    
    // Type and send a chat message
    await page.type('input[placeholder="Type a message..."]', 'Hello Team! Saif is presenting the SkyConnect project demo.');
    await page.keyboard.press('Enter');
    await delay(2000); // Wait for message to render in chat area
    
    const chatScreenshotPath = path.join(ARTIFACTS_DIR, 'chat_screenshot.png');
    await page.screenshot({ path: chatScreenshotPath });
    console.log('📸 Saved Chat panel screenshot to:', chatScreenshotPath);

    console.log('\n🎉 ALL ACTIONS COMPLETED SUCCESSFULLY! HEADLESS WEB TEST ENDED.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Headless test run failed:', error.message);
    try {
      const errorScreenshot = path.join(ARTIFACTS_DIR, 'error_screenshot.png');
      await page.screenshot({ path: errorScreenshot });
      console.log('📸 Saved failure screenshot to:', errorScreenshot);
      const pageText = await page.evaluate(() => document.body.innerText);
      console.log('--- Page text content on failure ---');
      console.log(pageText);
      console.log('------------------------------------');
    } catch (e) {
      console.error('Failed to take failure screenshot:', e.message);
    }
    process.exit(1);
  } finally {
    await browser.close();
  }
};

run();
