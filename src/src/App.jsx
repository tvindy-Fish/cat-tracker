import React, { useState, useEffect } from 'react';
import { Camera, LogIn, LogOut, Clock, User, Plus, X, Upload } from 'lucide-react';

export default function App() {
  const [cats, setCats] = useState([]);
  const [activities, setActivities] = useState([]);
  const [userName, setUserName] = useState('');
  const [showAddCat, setShowAddCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropData, setCropData] = useState({ x: 25, y: 25, size: 50 });
  const [tempImage, setTempImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUserName, setTempUserName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [showDashboard, setShowDashboard] = useState(true);
  const [assignedEmojis, setAssignedEmojis] = useState({});
  const [selectedCatForScroll, setSelectedCatForScroll] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!showDashboard && selectedCatForScroll) {
      const element = document.getElementById(`cat-card-${selectedCatForScroll}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setSelectedCatForScroll(null);
      }
    }
  }, [showDashboard, selectedCatForScroll]);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      const now = Date.now();
      const newAlerts = [];
      
      cats.forEach(cat => {
        if (cat.status === 'outside') {
          const timeSinceChange = now - new Date(cat.lastChanged).getTime();
          const hoursOutside = Math.floor(timeSinceChange / (1000 * 60 * 60));
          
          if (hoursOutside >= 1) {
            const alertId = `${cat.id}-${hoursOutside}`;
            if (!alerts.find(a => a.id === alertId)) {
              newAlerts.push({
                id: alertId,
                catName: cat.name,
                hours: hoursOutside,
                timestamp: now
              });
            }
          }
        }
      });
      
      if (newAlerts.length > 0) {
        setAlerts(prev => [...prev, ...newAlerts]);
      }
    }, 60000);

    return () => clearInterval(checkInterval);
  }, [cats, alerts]);

  const loadData = () => {
    try {
      const storedCats = localStorage.getItem('cats');
      const storedActivities = localStorage.getItem('activities');
      const storedUserName = localStorage.getItem('userName');
      
      if (storedCats) setCats(JSON.parse(storedCats));
      if (storedActivities) setActivities(JSON.parse(storedActivities));
      if (storedUserName) setUserName(storedUserName);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCats = (newCats) => {
    setCats(newCats);
    localStorage.setItem('cats', JSON.stringify(newCats));
  };

  const saveActivities = (newActivities) => {
    setActivities(newActivities);
    localStorage.setItem('activities', JSON.stringify(newActivities));
  };

  const saveUserName = (name) => {
    setUserName(name);
    localStorage.setItem('userName', name);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const addCat = () => {
    if (newCatName.trim() && cats.length < 6) {
      const newCat = {
        id: Date.now(),
        name: newCatName.trim(),
        status: 'inside',
        images: selectedImage ? [selectedImage] : [],
        currentImageIndex: 0,
        lastChanged: new Date().toISOString(),
        changedBy: userName || 'Unknown'
      };
      saveCats([...cats, newCat]);
      setNewCatName('');
      setSelectedImage(null);
      setShowAddCat(false);
    }
  };

  const toggleCatStatus = (catId) => {
    if (!userName) {
      alert('Please set your name first!');
      return;
    }

    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.15);
      
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 600;
        gainNode2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);
      }, 100);
    } catch (err) {
      console.log('Audio failed:', err);
    }

    const updatedCats = cats.map(cat => {
      if (cat.id === catId) {
        const newStatus = cat.status === 'inside' ? 'outside' : 'inside';
        const now = new Date().toISOString();
        
        saveActivities([{
          id: Date.now(),
          catName: cat.name,
          action: newStatus,
          user: userName,
          timestamp: now
        }, ...activities]);
        
        if (newStatus === 'inside') {
          setAlerts(prev => prev.filter(alert => alert.catName !== cat.name));
        }
        
        return {
          ...cat,
          status: newStatus,
          lastChanged: now,
          changedBy: userName
        };
      }
      return cat;
    });
    
    saveCats(updatedCats);
  };

  const getTimeSince = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const openImagePicker = (catId) => {
    setSelectedCatId(catId);
    setShowImagePicker(true);
    setSelectedImage(null);
  };

  const handleNewImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImage(reader.result);
        setShowImagePicker(false);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const selectCatImage = (imageIndex) => {
    const updatedCats = cats.map(cat => {
      if (cat.id === selectedCatId) {
        return { ...cat, currentImageIndex: imageIndex };
      }
      return cat;
    });
    saveCats(updatedCats);
    setShowImagePicker(false);
    setSelectedCatId(null);
  };

  const cropImage = () => {
    if (!tempImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const scaleX = img.width / 100;
      const scaleY = img.height / 100;
      const size = cropData.size * Math.min(scaleX, scaleY);
      canvas.width = size;
      canvas.height = size;
      ctx.drawImage(img, cropData.x * scaleX, cropData.y * scaleY, cropData.size * scaleX, cropData.size * scaleY, 0, 0, size, size);
      
      const croppedImage = canvas.toDataURL();
      setSelectedImage(croppedImage);
      setShowCropper(false);
      setTempImage(null);
      setCropData({ x: 25, y: 25, size: 50 });
      
      if (selectedCatId) {
        const updatedCats = cats.map(cat => {
          if (cat.id === selectedCatId) {
            const images = cat.images || [];
            const newImages = [...images, croppedImage];
            return { ...cat, images: newImages, currentImageIndex: newImages.length - 1 };
          }
          return cat;
        });
        saveCats(updatedCats);
        setSelectedCatId(null);
        setSelectedImage(null);
      }
    };
    img.src = tempImage;
  };

  const cancelCrop = () => {
    setShowCropper(false);
    setTempImage(null);
    setCropData({ x: 25, y: 25, size: 50 });
    if (selectedCatId) setShowImagePicker(true);
  };

  const handleCropMouseDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x >= cropData.x && x <= cropData.x + cropData.size && y >= cropData.y && y <= cropData.y + cropData.size) {
      setIsDragging(true);
      setDragStart({ x: x - cropData.x, y: y - cropData.y });
    }
  };

  const handleCropMouseMove = (e) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const newX = Math.max(0, Math.min(100 - cropData.size, x - dragStart.x));
    const newY = Math.max(0, Math.min(100 - cropData.size, y - dragStart.y));
    setCropData({ ...cropData, x: newX, y: newY });
  };

  const handleCropMouseUp = () => setIsDragging(false);

  const handleCropTouchStart = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    if (x >= cropData.x && x <= cropData.x + cropData.size && y >= cropData.y && y <= cropData.y + cropData.size) {
      setIsDragging(true);
      setDragStart({ x: x - cropData.x, y: y - cropData.y });
    }
  };

  const handleCropTouchMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((touch.clientX - rect.left) / rect.width) * 100;
    const y = ((touch.clientY - rect.top) / rect.height) * 100;
    const newX = Math.max(0, Math.min(100 - cropData.size, x - dragStart.x));
    const newY = Math.max(0, Math.min(100 - cropData.size, y - dragStart.y));
    setCropData({ ...cropData, x: newX, y: newY });
  };

  const increaseCropSize = () => {
    const newSize = Math.min(100, cropData.size + 10);
    setCropData({ size: newSize, x: Math.min(cropData.x, 100 - newSize), y: Math.min(cropData.y, 100 - newSize) });
  };

  const decreaseCropSize = () => {
    setCropData({ ...cropData, size: Math.max(20, cropData.size - 10) });
  };

  const handleNameDoubleClick = () => {
    setIsEditingName(true);
    setTempUserName(userName);
  };

  const handleNameSave = () => {
    if (tempUserName.trim()) {
      saveUserName(tempUserName.trim());
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setTempUserName('');
  };

  const dismissAlert = (alertId) => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const getCatEmoji = (catId) => {
    const catEmojis = ['🐈', '🐈‍⬛', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '🐱', '🦁', '🐯', '🐅', '🐆'];
    if (assignedEmojis[catId]) return assignedEmojis[catId];
    const usedEmojis = Object.values(assignedEmojis);
    const availableEmoji = catEmojis.find(emoji => !usedEmojis.includes(emoji));
    if (availableEmoji) {
      setAssignedEmojis({ ...assignedEmojis, [catId]: availableEmoji });
      return availableEmoji;
    }
    return catEmojis[0];
  };

  const handleCatClick = (catId) => {
    setSelectedCatForScroll(catId);
    setShowDashboard(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!userName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 text-center mb-2">🐱 Cat Tracker</h1>
          <p className="text-gray-600 text-center mb-6">Welcome! Please enter your name to get started.</p>
          <input
            type="text"
            placeholder="Enter your name"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && nameInput.trim()) {
                saveUserName(nameInput.trim());
                setNameInput('');
              }
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg mb-4"
            autoFocus
          />
          <button
            onClick={() => {
              if (nameInput.trim()) {
                saveUserName(nameInput.trim());
                setNameInput('');
              }
            }}
            disabled={!nameInput.trim()}
            className="w-full bg-purple-500 text-white py-3 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
