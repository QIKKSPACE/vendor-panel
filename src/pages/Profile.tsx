import React from 'react'
import MobileSliderNav from '../components/MobileSliderNav';
import Navigation from '../components/Navigation';
import VendorProfile from '../components/VendorProfile';
function Profile() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">

  <MobileSliderNav />

  <Navigation
   
  />
  <VendorProfile />
  </div>
  )
}

export default Profile