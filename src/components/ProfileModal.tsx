
import React, { useState, useEffect } from 'react';
import { useData } from '../DataContext';
import { X, Camera, Save, User, Mail, Phone, Hash, Image as ImageIcon } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateUserProfile } = useData();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    profileImage: ''
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (currentUser) {
      setFormData({
        name: currentUser.name || '',
        mobile: currentUser.mobile || '',
