const firebaseReady = (async () => {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js');
  const { getAuth, signInAnonymously } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js');
  const { getFirestore, collection, doc, onSnapshot, runTransaction } = await import('https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js');

  const firebaseConfig = {
    apiKey: 'AIzaSyD7KZHUmQX0uSaMdWVHzig86Ds1dZQllAs',
    authDomain: 'wishlist-21fc6.firebaseapp.com',
    projectId: 'wishlist-21fc6',
    storageBucket: 'wishlist-21fc6.firebasestorage.app',
    messagingSenderId: '1040292394794',
    appId: '1:1040292394794:web:cd9baa1c111d8115b39053',
    measurementId: 'G-5GHG6BH58L'
  };

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInAnonymously(auth);

  // Every gift button is identified by the product link inside its card.
  const buttons = () => [...document.querySelectorAll('.gift')];
  const keyFor = (button) => {
    const card = button.closest('.card');
    const link = card?.querySelector('.link')?.href || '';
    return encodeURIComponent(link || card?.querySelector('h3')?.textContent?.trim() || 'wish');
  };

  const setTaken = (button, taken) => {
    button.classList.toggle('on', taken);
    button.textContent = taken ? '🎁 подарок уже занят' : '🎁 я подарю';
  };

  // Keep every visitor's page synchronized in real time.
  onSnapshot(collection(db, 'wishes'), (snapshot) => {
    const taken = new Set();
    snapshot.forEach((item) => {
      if (item.data()?.taken) taken.add(item.id);
    });
    buttons().forEach((button) => setTaken(button, taken.has(keyFor(button))));
  });

  window.gift = async (button) => {
    if (!button || button.dataset.busy === '1') return;
    button.dataset.busy = '1';
    button.classList.add('pop');

    try {
      const id = keyFor(button);
      const wishRef = doc(db, 'wishes', id);
      const result = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(wishRef);
        if (snap.exists() && snap.data()?.taken) return false;
        transaction.set(wishRef, {
          taken: true,
          updatedAt: Date.now()
        }, { merge: true });
        return true;
      });

      if (result) {
        setTaken(button, true);
      } else {
        setTaken(button, true);
      }
    } catch (error) {
      console.error('Firebase gift error:', error);
      button.textContent = '🎁 попробуй ещё раз';
      setTimeout(() => {
        if (!button.classList.contains('on')) button.textContent = '🎁 я подарю';
      }, 1800);
    } finally {
      setTimeout(() => button.classList.remove('pop'), 450);
      button.dataset.busy = '0';
    }
  };
})();
