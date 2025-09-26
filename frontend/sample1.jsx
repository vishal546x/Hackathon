import React, { useState, useEffect } from 'react';
import { Users, Folder, Handshake, Target } from 'lucide-react';

const GrowthRoadmap = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [roadOffset, setRoadOffset] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');

  const milestones = [
    {
      id: 1,
      title: 'Team Building',
      description: 'Lorem ipsum dolor sit amet. Nam laboriosam molestiae quo.',
      icon: Users,
      color: 'from-red-500 to-red-600',
      position: { top: '75%', left: '15%' }
    },
    {
      id: 2,
      title: 'Project Setup',
      description: 'Lorem ipsum dolor sit amet. Nam laboriosam molestiae quo.',
      icon: Folder,
      color: 'from-orange-500 to-orange-600',
      position: { top: '55%', left: '35%' }
    },
    {
      id: 3,
      title: 'Partnership',
      description: 'Lorem ipsum dolor sit amet. Nam laboriosam molestiae quo.',
      icon: Handshake,
      color: 'from-green-500 to-green-600',
      position: { top: '35%', left: '55%' }
    },
    {
      id: 4,
      title: 'Market Research',
      description: 'Lorem ipsum dolor sit amet. Nam laboriosam molestiae quo.',
      icon: Target,
      color: 'from-blue-500 to-blue-600',
      position: { top: '15%', left: '75%' }
    }
  ];

  const travelTo = async (milestoneId) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setActiveMilestone(milestoneId);
    setStatusMessage(`Traveling to ${milestones.find(m => m.id === milestoneId).title}...`);

    // Animate road movement
    const animationDistance = milestoneId * 100;
    setRoadOffset(animationDistance);

    // Wait for animation to complete
    setTimeout(() => {
      setStatusMessage(`Arrived at ${milestones.find(m => m.id === milestoneId).title}!`);
      setTimeout(() => {
        setActiveMilestone(null);
        setStatusMessage('');
        setIsAnimating(false);
        setRoadOffset(0);
      }, 1500);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-800 overflow-hidden relative">
      {/* Title */}
      <div className="absolute top-8 left-8 z-20">
        <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
          GROWTH ROADMAP
        </h1>
      </div>

      {/* Status Display */}
      {statusMessage && (
        <div className="absolute top-8 right-8 z-20 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 text-gray-800 font-semibold shadow-lg transform animate-in slide-in-from-top-2">
          {statusMessage}
        </div>
      )}

      {/* Main Roadmap Container */}
      <div className="relative w-full h-screen flex items-center justify-center perspective-1000">
        {/* Road Container */}
        <div className="relative w-full max-w-6xl h-full">
          
          {/* Curved Road Path */}
          <svg 
            className="absolute inset-0 w-full h-full z-0" 
            viewBox="0 0 800 600" 
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style={{stopColor:'#2d3748', stopOpacity:1}} />
                <stop offset="100%" style={{stopColor:'#1a202c', stopOpacity:1}} />
              </linearGradient>
            </defs>
            
            {/* Main Road Path */}
            <path
              d="M 50 550 Q 200 450, 350 350 Q 500 250, 650 150 Q 750 100, 800 50"
              stroke="url(#roadGradient)"
              strokeWidth="120"
              fill="none"
              className="drop-shadow-2xl"
            />
            
            {/* Road Center Line */}
            <path
              d="M 50 550 Q 200 450, 350 350 Q 500 250, 650 150 Q 750 100, 800 50"
              stroke="white"
              strokeWidth="4"
              fill="none"
              strokeDasharray="30 20"
              className={`transition-all duration-2000 ${isAnimating ? 'animate-pulse' : ''}`}
              style={{
                strokeDashoffset: roadOffset,
                transition: 'stroke-dashoffset 2s ease-in-out'
              }}
            />
          </svg>

          {/* Milestones */}
          {milestones.map((milestone) => {
            const IconComponent = milestone.icon;
            return (
              <div
                key={milestone.id}
                className={`absolute z-10 transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                  activeMilestone === milestone.id 
                    ? 'scale-110 animate-pulse' 
                    : 'hover:scale-105 hover:-translate-y-2'
                }`}
                style={{
                  top: milestone.position.top,
                  left: milestone.position.left,
                }}
                onClick={() => travelTo(milestone.id)}
              >
                {/* Milestone Circle */}
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${milestone.color} flex items-center justify-center shadow-2xl border-4 border-white/20 backdrop-blur-sm`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                
                {/* Connecting Line to Road */}
                <div className="absolute top-10 left-10 w-0.5 h-8 bg-white/40 transform rotate-45"></div>
                
                {/* Info Card */}
                <div className={`absolute top-24 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-xl min-w-48 transition-all duration-300 ${
                  activeMilestone === milestone.id || !isAnimating
                    ? 'opacity-0 hover:opacity-100 translate-y-2 hover:translate-y-0'
                    : 'opacity-0'
                }`}>
                  <h3 className="font-bold text-gray-800 mb-2">{milestone.title}</h3>
                  <p className="text-sm text-gray-600">{milestone.description}</p>
                </div>
              </div>
            );
          })}

          {/* Moving Car */}
          <div 
            className={`absolute z-15 transition-all duration-2000 ease-in-out ${isAnimating ? 'transform' : ''}`}
            style={{
              bottom: activeMilestone ? `${85 - (activeMilestone * 15)}%` : '85%',
              left: activeMilestone ? `${10 + (activeMilestone * 15)}%` : '10%',
            }}
          >
            <div className="relative">
              {/* Car Body */}
              <div className="w-16 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg transform rotate-45">
                {/* Car Windows */}
                <div className="absolute top-1 left-2 right-1 h-4 bg-blue-200/50 rounded"></div>
              </div>
              
              {/* Car Wheels */}
              <div className="absolute -bottom-1 left-1 w-3 h-3 bg-gray-800 rounded-full"></div>
              <div className="absolute -bottom-1 right-1 w-3 h-3 bg-gray-800 rounded-full"></div>
              
              {/* Motion Trail */}
              {isAnimating && (
                <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                  <div className="flex space-x-1">
                    <div className="w-1 h-1 bg-white/60 rounded-full animate-ping"></div>
                    <div className="w-1 h-1 bg-white/40 rounded-full animate-ping" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-1 h-1 bg-white/20 rounded-full animate-ping" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating Particles */}
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/30 rounded-full animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Progress Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
            <div className="flex space-x-2">
              {milestones.map((milestone) => (
                <div
                  key={milestone.id}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    activeMilestone === milestone.id
                      ? 'bg-white scale-125'
                      : 'bg-white/40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
      
      {/* Animated Background Shapes */}
      <div className="absolute top-20 right-20 w-32 h-32 bg-white/5 rounded-full animate-pulse" />
      <div className="absolute bottom-32 left-16 w-24 h-24 bg-white/5 rounded-full animate-pulse" style={{animationDelay: '1s'}} />
      <div className="absolute top-1/2 right-32 w-16 h-16 bg-white/5 rounded-full animate-pulse" style={{animationDelay: '2s'}} />
    </div>
  );
};

export default GrowthRoadmap;