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
# Code
{alerts.length > 0 && (
          <div className="mb-4 space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="bg-orange-500 text-white p-4 rounded-lg flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-semibold">{alert.catName} has been outside for {alert.hours} hour{alert.hours > 1 ? 's' : ''}.</span>
                </div>
                <button onClick={() => dismissAlert(alert.id)} className="text-white hover:text-gray-200 transition-colors">
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">🐱 Cat Tracker</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDashboard(!showDashboard)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {showDashboard ? 'Show List' : 'Show Dashboard'}
              </button>
              <button
                onClick={() => setShowAddCat(true)}
                disabled={cats.length >= 6}
                className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 flex items-center gap-2 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus size={20} />
                Add Cat
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <User size={20} />
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="text"
                  value={tempUserName}
                  onChange={(e) => setTempUserName(e.target.value)}
                  className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave();
                    if (e.key === 'Escape') handleNameCancel();
                  }}
                />
                <button onClick={handleNameSave} className="bg-purple-500 text-white px-3 py-1 rounded-lg hover:bg-purple-600 transition-colors text-sm">Save</button>
                <button onClick={handleNameCancel} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-lg hover:bg-gray-300 transition-colors text-sm">Cancel</button>
              </div>
            ) : (
              <span className="font-medium cursor-pointer hover:text-purple-600 transition-colors" onDoubleClick={handleNameDoubleClick} title="Double-click to edit">{userName}</span>
            )}
          </div>
        </div>

        {showAddCat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Add New Cat</h2>
                <button onClick={() => { setShowAddCat(false); setNewCatName(''); setSelectedImage(null); }} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Cat's name"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                autoFocus
              />
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture (optional)</label>
                {selectedImage && <img src={selectedImage} alt="Preview" className="w-32 h-32 object-cover mx-auto mb-4" />}
                <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                  <Upload size={20} />
                  Choose Image
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>
              <button onClick={addCat} disabled={!newCatName.trim()} className="w-full bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors">
                Add Cat
              </button>
            </div>
          </div>
        )}

        {showCropper && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Crop Image</h2>
                <button onClick={cancelCrop} className="text-gray-500 hover:text-gray-700"><X size={24} /></button>
              </div>
              <div className="mb-4">
                <div 
                  className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-move select-none"
                  onMouseDown={handleCropMouseDown}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onMouseLeave={handleCropMouseUp}
                  onTouchStart={handleCropTouchStart}
                  onTouchMove={handleCropTouchMove}
                  onTouchEnd={handleCropMouseUp}
                >
                  {tempImage && (
                    <>
                      <img src={tempImage} alt="Crop" className="w-full h-full object-contain pointer-events-none" />
                      <div className="absolute border-4 border-purple-500 bg-purple-500 bg-opacity-20 cursor-move" style={{ left: `${cropData.x}%`, top: `${cropData.y}%`, width: `${cropData.size}%`, height: `${cropData.size}%`, pointerEvents: 'none' }}>
                        <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-semibold">Drag to move</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={decreaseCropSize} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold">− Smaller</button>
                <button onClick={increaseCropSize} className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg hover:bg-gray-300 transition-colors font-semibold">+ Larger</button>
              </div>
              <div className="flex gap-2">
                <button onClick={cancelCrop} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors">Cancel</button>
                <button onClick={cropImage} className="flex-1 bg-purple-500 text-white py-2 rounded-lg hover:bg-purple-600 transition-colors">Crop & Use</button>
              </div>
            </div>
          </div>
        )}

        {showImagePicker && selectedCatId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Choose Photo</h2>
                <button onClick={() => { setShowImagePicker(false); setSelectedImage(null); setSelectedCatId(null); }} className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>
              {cats.find(c => c.id === selectedCatId)?.images?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Choose from {cats.find(c => c.id === selectedCatId)?.name}'s photos:</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {cats.find(c => c.id === selectedCatId).images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => selectCatImage(idx)}
                        className={`cursor-pointer rounded-lg overflow-hidden border-4 transition-all ${cats.find(c => c.id === selectedCatId).currentImageIndex === idx ? 'border-purple-500 scale-95' : 'border-transparent hover:border-purple-300'}`}
                      >
                        <img src={img} alt={`Option ${idx + 1}`} className="w-full h-24 object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className={cats.find(c => c.id === selectedCatId)?.images?.length > 0 ? 'border-t pt-4' : ''}>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Upload a new photo for {cats.find(c => c.id === selectedCatId)?.name}:</h3>
                <label className="cursor-pointer bg-gray-100 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2">
                  <Upload size={20} />
                  Choose New Image
                  <input type="file" accept="image/*" onChange={handleNewImageUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        )}
{cats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No cats added yet!</p>
            <p className="text-gray-400">Click "Add Cat" to get started</p>
          </div>
        ) : showDashboard ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Cat Status Dashboard</h2>
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative w-full mb-32">
                <svg viewBox="0 0 400 470" className="w-full h-auto">
                  <rect x="100" y="120" width="200" height="242" fill="none" stroke="#000000" strokeWidth="3"/>
                  <path d="M 50 120 L 200 40 L 350 120" fill="none" stroke="#000000" strokeWidth="3"/>
                </svg>
                <div className="absolute" style={{ top: '30%', left: '25%', width: '50%', height: '58%' }}>
                  <div className="w-full h-full flex flex-wrap gap-1 items-start justify-center content-start p-1">
                    {cats.filter(cat => cat.status === 'inside').map((cat) => (
                      <div key={cat.id} onClick={() => handleCatClick(cat.id)} className="cursor-pointer hover:scale-110 transition-transform flex-shrink-0" title={cat.name}>
                        <div className={`w-12 h-12 rounded flex items-center justify-center text-2xl ${cat.images?.length > 0 ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-white'}`}>
                          {cat.images?.length > 0 ? <img src={cat.images[cat.currentImageIndex || 0]} alt={cat.name} className="w-full h-full object-cover rounded" /> : getCatEmoji(cat.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute w-full" style={{ top: '90%' }}>
                  <div className="w-full flex flex-wrap gap-3 items-start justify-center pt-4">
                    {cats.filter(cat => cat.status === 'outside').map((cat) => (
                      <div key={cat.id} onClick={() => handleCatClick(cat.id)} className="cursor-pointer hover:scale-110 transition-transform" title={cat.name}>
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${cat.images?.length > 0 ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-white'}`}>
                          {cat.images?.length > 0 ? <img src={cat.images[cat.currentImageIndex || 0]} alt={cat.name} className="w-full h-full object-cover rounded-lg" /> : getCatEmoji(cat.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-6 justify-center mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">Inside: {cats.filter(cat => cat.status === 'inside').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">Outside: {cats.filter(cat => cat.status === 'outside').length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {cats.map(cat => (
              <div key={cat.id} id={`cat-card-${cat.id}`} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-48 h-60 flex-shrink-0">
                    <div className="absolute top-0 left-0 w-full">
                      <svg viewBox="0 0 100 100" className="w-full h-36">
                        <rect x="25" y="40" width="50" height="50" fill="none" stroke="#000000" strokeWidth="2"/>
                        <path d="M 15 40 L 50 15 L 85 40" fill="none" stroke="#000000" strokeWidth="2"/>
                      </svg>
                    </div>
                    <button
                      onClick={() => openImagePicker(cat.id)}
                      style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: cat.status === 'inside' ? (cat.images?.length > 0 ? '57px' : '68px') : '180px', transition: 'top 0.3s ease' }}
                      className={`w-18 h-18 flex items-center justify-center text-white text-2xl overflow-hidden hover:opacity-80 cursor-pointer group ${cat.images?.length > 0 ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-white'}`}
                    >
                      {cat.images?.length > 0 ? (
                        <>
                          <img src={cat.images[cat.currentImageIndex || 0]} alt={cat.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <Camera size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center text-5xl">
                          {getCatEmoji(cat.id)}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <Camera size={20} className="opacity-0 group-hover:opacity-100 transition-opacity text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{cat.name}</h3>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${cat.status === 'inside' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {cat.status === 'inside' ? '🏠 Inside' : '☀️ Outside'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock size={14} />
                      <span>{getTimeSince(cat.lastChanged)} ago</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <User size={14} />
                      <span>by {cat.changedBy}</span>
                    </div>
                    <button
                      onClick={() => toggleCatStatus(cat.id)}
                      className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${cat.status === 'inside' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                      {cat.status === 'inside' ? <><LogOut size={18} />Inside - Let Out</> : <><LogIn size={18} />Outside - Let In</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activities.length > 0 && !showDashboard && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.slice(0, 20).map(activity => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.action === 'inside' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <span className="font-medium text-gray-800">{activity.catName}</span>
                    <span className="text-gray-600">went {activity.action}</span>
                  </div>
                  <div className="text-sm text-gray-500">{activity.user} • {getTimeSince(activity.timestamp)} ago</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
{cats.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No cats added yet!</p>
            <p className="text-gray-400">Click "Add Cat" to get started</p>
          </div>
        ) : showDashboard ? (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Cat Status Dashboard</h2>
            <div className="w-full max-w-4xl mx-auto">
              <div className="relative w-full mb-32">
                <svg viewBox="0 0 400 470" className="w-full h-auto">
                  <rect x="100" y="120" width="200" height="242" fill="none" stroke="#000000" strokeWidth="3"/>
                  <path d="M 50 120 L 200 40 L 350 120" fill="none" stroke="#000000" strokeWidth="3"/>
                </svg>
                <div className="absolute" style={{ top: '30%', left: '25%', width: '50%', height: '58%' }}>
                  <div className="w-full h-full flex flex-wrap gap-1 items-start justify-center content-start p-1">
                    {cats.filter(cat => cat.status === 'inside').map((cat) => (
                      <div key={cat.id} onClick={() => handleCatClick(cat.id)} className="cursor-pointer hover:scale-110 transition-transform flex-shrink-0" title={cat.name}>
                        <div className={`w-12 h-12 rounded flex items-center justify-center text-2xl ${cat.images?.length > 0 ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-white'}`}>
                          {cat.images?.length > 0 ? <img src={cat.images[cat.currentImageIndex || 0]} alt={cat.name} className="w-full h-full object-cover rounded" /> : getCatEmoji(cat.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="absolute w-full" style={{ top: '90%' }}>
                  <div className="w-full flex flex-wrap gap-3 items-start justify-center pt-4">
                    {cats.filter(cat => cat.status === 'outside').map((cat) => (
                      <div key={cat.id} onClick={() => handleCatClick(cat.id)} className="cursor-pointer hover:scale-110 transition-transform" title={cat.name}>
                        <div className={`w-16 h-16 rounded-lg flex items-center justify-center text-3xl ${cat.images?.length > 0 ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-white'}`}>
                          {cat.images?.length > 0 ? <img src={cat.images[cat.currentImageIndex || 0]} alt={cat.name} className="w-full h-full object-cover rounded-lg" /> : getCatEmoji(cat.id)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-6 justify-center mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">Inside: {cats.filter(cat => cat.status === 'inside').length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">Outside: {cats.filter(cat => cat.status === 'outside').length}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {cats.map(cat => (
              <div key={cat.id} id={`cat-card-${cat.id}`} className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative w-48 h-60 flex-shrink-0">
                    <div className="absolute top-0 left-0 w-full">
                      <svg viewBox="0 0 100 100" className="w-full h-36">
                        <rect x="25" y="40" width="50" height="50" fill="none" stroke="#000000" strokeWidth="2"/>
                        <path d="M 15 40 L 50 15 L 85 40" fill="none" stroke="#000000" strokeWidth="2"/>
                      </svg>
                    </div>
                    <button
                      onClick={() => openImagePicker(cat.id)}
                      style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: cat.status === 'inside' ? (cat.images?.length > 0 ? '57px' : '68px') : '180px', transition: 'top 0.3s ease' }}
                      className={`w-18 h-18 flex items-center justify-center text-white text-2xl overflow-hidden hover:opacity-80 cursor-pointer group ${cat.images?.length > 0 ? 'bg-gradient-to-br from-purple-400 to-pink-400' : 'bg-white'}`}
                    >
                      {cat.images?.length > 0 ? (
                        <>
                          <img src={cat.images[cat.currentImageIndex || 0]} alt={cat.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <Camera size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </>
                      ) : (
                        <div className="relative w-full h-full flex items-center justify-center text-5xl">
                          {getCatEmoji(cat.id)}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                            <Camera size={20} className="opacity-0 group-hover:opacity-100 transition-opacity text-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-800 mb-1">{cat.name}</h3>
                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-2 ${cat.status === 'inside' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                      {cat.status === 'inside' ? '🏠 Inside' : '☀️ Outside'}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Clock size={14} />
                      <span>{getTimeSince(cat.lastChanged)} ago</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <User size={14} />
                      <span>by {cat.changedBy}</span>
                    </div>
                    <button
                      onClick={() => toggleCatStatus(cat.id)}
                      className={`w-full py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors ${cat.status === 'inside' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                    >
                      {cat.status === 'inside' ? <><LogOut size={18} />Inside - Let Out</> : <><LogIn size={18} />Outside - Let In</>}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activities.length > 0 && !showDashboard && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activities.slice(0, 20).map(activity => (
                <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${activity.action === 'inside' ? 'bg-green-500' : 'bg-blue-500'}`} />
                    <span className="font-medium text-gray-800">{activity.catName}</span>
                    <span className="text-gray-600">went {activity.action}</span>
                  </div>
                  <div className="text-sm text-gray-500">{activity.user} • {getTimeSince(activity.timestamp)} ago</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
