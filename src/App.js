import React, { useState, useEffect } from 'react';
import { Briefcase, Code, TestTube, ExternalLink, Plus, LogOut, Eye, Edit, Trash2, Lock, FolderPlus } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set, push, remove, update } from 'firebase/database';

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJTvsuY7g8t_Y6KlqTTEDL2Dd4FY805zU",
  authDomain: "portofolio-c3172.firebaseapp.com",
  databaseURL: "https://portofolio-c3172-default-rtdb.firebaseio.com",
  projectId: "portofolio-c3172",
  storageBucket: "portofolio-c3172.firebasestorage.app",
  messagingSenderId: "76660438100",
  appId: "1:76660438100:web:bf357beaf4d301b34d69c1",
  measurementId: "G-WL1CBL1S6P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const App = () => {
  const [user, setUser] = useState({ email: 'guest' });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [portfolios, setPortfolios] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    architecture: '',
    features: '',
    challenges: '',
    testResults: '',
    codeLink: '',
    coverImage: null,
    coverTitle: '',
    coverSubtitle: '',
    logoImage: null,
    testImages: []
  });

  // Load data from Firebase
  useEffect(() => {
    loadCategories();
    loadPortfolios();
  }, []);

  const loadCategories = () => {
    const categoriesRef = ref(database, 'categories');
    onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoryList = Object.values(data).map(cat => cat.name);
        setCategories(categoryList);
      }
      setLoading(false);
    });
  };

  const loadPortfolios = () => {
    const portfoliosRef = ref(database, 'portfolios');
    onValue(portfoliosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const portfolioList = Object.keys(data).map(key => ({
          ...data[key],
          id: key
        }));
        setPortfolios(portfolioList);
      } else {
        setPortfolios([]);
      }
    });
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    
    const usersRef = ref(database, 'users/admin');
    onValue(usersRef, (snapshot) => {
      const adminData = snapshot.val();
      if (adminData && email === adminData.email && password === adminData.password) {
        setUser({ email });
        setIsAdmin(true);
        setShowLoginModal(false);
        setEmail('');
        setPassword('');
        
        // Update last login
        update(ref(database, 'users/admin'), {
          lastLogin: new Date().toISOString()
        });
      } else {
        alert('Email atau password salah!');
      }
    }, { onlyOnce: true });
  };

  const handleLogout = () => {
    setUser({ email: 'guest' });
    setIsAdmin(false);
    setEmail('');
    setPassword('');
  };

  const handleImageUpload = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'testImages') {
          setFormData({
            ...formData,
            testImages: [...formData.testImages, reader.result]
          });
        } else {
          setFormData({ ...formData, [field]: reader.result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeTestImage = (index) => {
    setFormData({
      ...formData,
      testImages: formData.testImages.filter((_, i) => i !== index)
    });
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !categories.includes(newCategory.trim())) {
      const newCatRef = push(ref(database, 'categories'));
      set(newCatRef, {
        id: newCatRef.key,
        name: newCategory.trim(),
        createdAt: new Date().toISOString()
      }).then(() => {
        setNewCategory('');
        setShowCategoryModal(false);
        alert('Kategori berhasil ditambahkan!');
      }).catch((error) => {
        alert('Error: ' + error.message);
      });
    } else {
      alert('Kategori sudah ada atau kosong!');
    }
  };

  const handleAddProject = () => {
    if (!formData.title || !formData.description || !formData.category) {
      alert('Mohon isi title, description, dan category!');
      return;
    }

    const newProjectRef = push(ref(database, 'portfolios'));
    const newProject = {
      ...formData,
      id: newProjectRef.key,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    set(newProjectRef, newProject)
      .then(() => {
        resetForm();
        alert('Project berhasil ditambahkan!');
      })
      .catch((error) => {
        alert('Error: ' + error.message);
      });
  };

  const handleEditProject = () => {
    const projectRef = ref(database, `portfolios/${editingProject.id}`);
    const updatedProject = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    update(projectRef, updatedProject)
      .then(() => {
        resetForm();
        alert('Project berhasil diupdate!');
      })
      .catch((error) => {
        alert('Error: ' + error.message);
      });
  };

  const handleDeleteProject = (id) => {
    if (window.confirm('Yakin ingin menghapus project ini?')) {
      remove(ref(database, `portfolios/${id}`))
        .then(() => {
          if (selectedProject?.id === id) {
            setSelectedProject(null);
          }
          alert('Project berhasil dihapus!');
        })
        .catch((error) => {
          alert('Error: ' + error.message);
        });
    }
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setFormData({ ...project });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setShowAddModal(false);
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      category: '',
      architecture: '',
      features: '',
      challenges: '',
      testResults: '',
      codeLink: '',
      coverImage: null,
      coverTitle: '',
      coverSubtitle: '',
      logoImage: null,
      testImages: []
    });
  };

  const filteredPortfolios = selectedCategory === 'all' 
    ? portfolios 
    : portfolios.filter(p => p.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || user.email === 'guest') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <header className="bg-white shadow-md border-b border-blue-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Portfolio</h1>
            </div>
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
            >
              <Lock className="w-5 h-5" />
              <span>Admin Login</span>
            </button>
          </div>
        </header>

        <div className="max-w-7xl mx-auto p-4 md:p-8">
          <div className="mb-8 flex flex-wrap gap-3">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All Projects
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {!selectedProject ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPortfolios.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-blue-100">
                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-indigo-600 overflow-hidden">
                    {project.coverImage && (
                      <img
                        src={project.coverImage}
                        alt={project.title}
                        className="w-full h-full object-cover opacity-40"
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                      {project.logoImage && (
                        <div className="mb-3 bg-white p-3 rounded-xl shadow-xl">
                          <img
                            src={project.logoImage}
                            alt="logo"
                            className="w-16 h-16 object-contain"
                          />
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-center drop-shadow-lg">{project.coverTitle || project.title}</h3>
                      {project.coverSubtitle && (
                        <p className="text-sm mt-1 opacity-90">{project.coverSubtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {project.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setActiveTab('overview');
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-100">
              <div className="relative h-80 bg-gradient-to-br from-blue-600 to-indigo-600 overflow-hidden">
                {selectedProject.coverImage && (
                  <img
                    src={selectedProject.coverImage}
                    alt={selectedProject.title}
                    className="w-full h-full object-cover opacity-30"
                  />
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                  {selectedProject.logoImage && (
                    <div className="mb-4 bg-white p-4 rounded-2xl shadow-2xl">
                      <img
                        src={selectedProject.logoImage}
                        alt="logo"
                        className="w-24 h-24 object-contain"
                      />
                    </div>
                  )}
                  <h2 className="text-4xl font-bold text-center drop-shadow-2xl mb-2">
                    {selectedProject.coverTitle || selectedProject.title}
                  </h2>
                  {selectedProject.coverSubtitle && (
                    <p className="text-xl opacity-90">{selectedProject.coverSubtitle}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-6 left-6 bg-white px-5 py-2 rounded-lg shadow-xl hover:bg-gray-100 transition-all font-semibold text-gray-700"
                >
                  ← Back
                </button>
              </div>

              <div className="p-8">
                <div className="mb-4">
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-full">
                    {selectedProject.category}
                  </span>
                </div>

                <div className="flex border-b border-blue-200 mb-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'overview'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('architecture')}
                    className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'architecture'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <Code className="w-4 h-4 inline mr-2" />
                    Architecture
                  </button>
                  <button
                    onClick={() => setActiveTab('tests')}
                    className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'tests'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <TestTube className="w-4 h-4 inline mr-2" />
                    Test Results
                  </button>
                  <button
                    onClick={() => setActiveTab('code')}
                    className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                      activeTab === 'code'
                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4 inline mr-2" />
                    Code Link
                  </button>
                </div>

                <div className="prose max-w-none">
                  {activeTab === 'overview' && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">Project Description</h3>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedProject.description}</p>
                    </div>
                  )}

                  {activeTab === 'architecture' && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">Technical Architecture</h3>
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                          {selectedProject.architecture}
                        </pre>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tests' && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">Test Results</h3>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500 mb-6">
                        <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                          {selectedProject.testResults}
                        </pre>
                      </div>
                      
                      {selectedProject.testImages && selectedProject.testImages.length > 0 && (
                        <div>
                          <h4 className="text-xl font-bold mb-4 text-gray-800">Test Screenshots</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedProject.testImages.map((img, idx) => (
                              <div key={idx} className="rounded-xl overflow-hidden border border-blue-200 shadow-lg hover:shadow-xl transition-all">
                                <img src={img} alt={`Test ${idx + 1}`} className="w-full h-auto" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'code' && (
                    <div>
                      <h3 className="text-2xl font-bold mb-4 text-gray-800">Source Code</h3>
                      <a
                        href={selectedProject.codeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-3 rounded-lg hover:from-gray-900 hover:to-black transition-all shadow-lg hover:shadow-xl"
                      >
                        <ExternalLink className="w-5 h-5" />
                        <span>View on GitHub</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-blue-100">
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-4 rounded-full shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Admin Login</h1>
              <p className="text-center text-gray-600 mb-8">Login untuk mengelola portfolio</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="admin@portfolio.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="••••••••"
                  />
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setEmail('');
                    setPassword('');
                  }}
                  className="w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 text-center">Demo Credentials:</p>
                <p className="text-sm text-gray-800 text-center font-mono">admin@portfolio.com / admin123</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <header className="bg-white shadow-md border-b border-blue-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-lg">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">My Portfolio</h1>
          </div>
          <div className="flex items-center space-x-3">
            {isAdmin && (
              <>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                >
                  <FolderPlus className="w-5 h-5" />
                  <span className="hidden md:inline">Category</span>
                </button>
                <button
                  onClick={() => {
                    setEditingProject(null);
                    resetForm();
                    setShowAddModal(true);
                  }}
                  className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden md:inline">Add Project</span>
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors px-3 py-2 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {!selectedProject ? (
          <>
            <div className="mb-8 flex flex-wrap gap-3">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                All Projects
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2 rounded-full font-medium transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPortfolios.map((project) => (
                <div key={project.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-blue-100">
                  <div className="relative h-48 bg-gradient-to-br from-blue-600 to-indigo-600 overflow-hidden">
                    {project.coverImage && (
                      <img
                        src={project.coverImage}
                        alt={project.title}
                        className="w-full h-full object-cover opacity-40"
                      />
                    )}
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
                      {project.logoImage && (
                        <div className="mb-3 bg-white p-3 rounded-xl shadow-xl">
                          <img
                            src={project.logoImage}
                            alt="logo"
                            className="w-16 h-16 object-contain"
                          />
                        </div>
                      )}
                      <h3 className="text-2xl font-bold text-center drop-shadow-lg">{project.coverTitle || project.title}</h3>
                      {project.coverSubtitle && (
                        <p className="text-sm mt-1 opacity-90">{project.coverSubtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                        {project.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{project.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{project.description}</p>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedProject(project);
                          setActiveTab('overview');
                        }}
                        className="flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={() => openEditModal(project)}
                            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-3 py-2 rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProject(project.id)}
                            className="flex items-center justify-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-2 rounded-lg hover:from-red-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-blue-100">
            <div className="relative h-80 bg-gradient-to-br from-blue-600 to-indigo-600 overflow-hidden">
              {selectedProject.coverImage && (
                <img
                  src={selectedProject.coverImage}
                  alt={selectedProject.title}
                  className="w-full h-full object-cover opacity-30"
                />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                {selectedProject.logoImage && (
                  <div className="mb-4 bg-white p-4 rounded-2xl shadow-2xl">
                    <img
                      src={selectedProject.logoImage}
                      alt="logo"
                      className="w-24 h-24 object-contain"
                    />
                  </div>
                )}
                <h2 className="text-4xl font-bold text-center drop-shadow-2xl mb-2">
                  {selectedProject.coverTitle || selectedProject.title}
                </h2>
                {selectedProject.coverSubtitle && (
                  <p className="text-xl opacity-90">{selectedProject.coverSubtitle}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-6 left-6 bg-white px-5 py-2 rounded-lg shadow-xl hover:bg-gray-100 transition-all font-semibold text-gray-700"
              >
                ← Back
              </button>
            </div>

            <div className="p-8">
              <div className="mb-4">
                <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 font-semibold rounded-full">
                  {selectedProject.category}
                </span>
              </div>

              <div className="flex border-b border-blue-200 mb-6 overflow-x-auto">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'overview'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('architecture')}
                  className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'architecture'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Code className="w-4 h-4 inline mr-2" />
                  Architecture
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'tests'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <TestTube className="w-4 h-4 inline mr-2" />
                  Test Results
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`px-6 py-3 font-semibold whitespace-nowrap transition-all ${
                    activeTab === 'code'
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <ExternalLink className="w-4 h-4 inline mr-2" />
                  Code Link
                </button>
              </div>

              <div className="prose max-w-none">
                {activeTab === 'overview' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Project Description</h3>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedProject.description}</p>
                  </div>
                )}

                {activeTab === 'architecture' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Technical Architecture</h3>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {selectedProject.architecture}
                      </pre>
                    </div>
                  </div>
                )}

                {activeTab === 'tests' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Test Results</h3>
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border-l-4 border-green-500 mb-6">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                        {selectedProject.testResults}
                      </pre>
                    </div>
                    
                    {selectedProject.testImages && selectedProject.testImages.length > 0 && (
                      <div>
                        <h4 className="text-xl font-bold mb-4 text-gray-800">Test Screenshots</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedProject.testImages.map((img, idx) => (
                            <div key={idx} className="rounded-xl overflow-hidden border border-blue-200 shadow-lg hover:shadow-xl transition-all">
                              <img src={img} alt={`Test ${idx + 1}`} className="w-full h-auto" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'code' && (
                  <div>
                    <h3 className="text-2xl font-bold mb-4 text-gray-800">Source Code</h3>
                    <a
                      href={selectedProject.codeLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-900 text-white px-6 py-3 rounded-lg hover:from-gray-900 hover:to-black transition-all shadow-lg hover:shadow-xl"
                    >
                      <ExternalLink className="w-5 h-5" />
                      <span>View on GitHub</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            <div className="p-6 max-h-[85vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {editingProject ? 'Edit Project' : 'Add New Project'}
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Pilih Kategori</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="border-t pt-5">
                  <h3 className="text-lg font-bold mb-3 text-gray-800">Cover Image & Template</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Title</label>
                      <input
                        type="text"
                        value={formData.coverTitle}
                        onChange={(e) => setFormData({ ...formData, coverTitle: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="E-Commerce"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Subtitle</label>
                      <input
                        type="text"
                        value={formData.coverSubtitle}
                        onChange={(e) => setFormData({ ...formData, coverSubtitle: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Full Stack Development"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'coverImage')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.coverImage && (
                      <img src={formData.coverImage} alt="Cover preview" className="mt-2 w-full h-32 object-cover rounded-lg" />
                    )}
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo/Result Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'logoImage')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {formData.logoImage && (
                      <img src={formData.logoImage} alt="Logo preview" className="mt-2 w-24 h-24 object-contain rounded-lg border" />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Architecture</label>
                  <textarea
                    value={formData.architecture}
                    onChange={(e) => setFormData({ ...formData, architecture: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Frontend: React.js&#10;Backend: Node.js&#10;Database: PostgreSQL"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Test Results</label>
                  <textarea
                    value={formData.testResults}
                    onChange={(e) => setFormData({ ...formData, testResults: e.target.value })}
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Unit Tests: 98% coverage&#10;Integration Tests: Passed 45/45"
                  />
                </div>

                <div className="border-t pt-5">
                  <h3 className="text-lg font-bold mb-3 text-gray-800">Test Screenshots</h3>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'testImages')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                  />
                  {formData.testImages && formData.testImages.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {formData.testImages.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img src={img} alt={`Test ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border" />
                          <button
                            onClick={() => removeTestImage(idx)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Code Link (GitHub)</label>
                  <input
                    type="url"
                    value={formData.codeLink}
                    onChange={(e) => setFormData({ ...formData, codeLink: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://github.com/username/project"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={editingProject ? handleEditProject : handleAddProject}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl"
                >
                  {editingProject ? 'Update Project' : 'Add Project'}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Add New Category</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="e.g. Machine Learning"
              />
            </div>

            <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm font-medium text-gray-700 mb-2">Existing Categories:</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <span key={cat} className="px-3 py-1 bg-white text-purple-700 text-xs font-semibold rounded-full border border-purple-200">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleAddCategory}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
              >
                Add Category
              </button>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setNewCategory('');
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;