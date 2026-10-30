import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart, Package, Truck, Users, ShieldCheck, Bell, LogOut, PlusCircle,
  Clock, CheckCircle2, XCircle, Search, User, HelpCircle, Award,
  FileText, MapPin, Calendar, Upload, ClipboardList, Activity,
  AlertOctagon, Camera
} from 'lucide-react';

// ============================================================================
// INITIAL SYSTEM SETUP — ZERO PRE-DEFINED DATA (CARDS START AT 0)
// ============================================================================
const STORAGE_KEYS = {
  USERS: 'cc_v3_users',
  DONATIONS: 'cc_v3_donations',
  REQUESTS: 'cc_v3_requests',
  TIMELINE: 'cc_v3_timeline',
  NOTIFICATIONS: 'cc_v3_notifications',
  COMPLAINTS: 'cc_v3_complaints',
  SESSION: 'cc_v3_session'
};

const INITIAL_ADMIN = {
  id: 'ADM-001',
  fullName: 'System Administrator',
  email: 'admin@communitycare.org',
  password: 'Admin@123',
  phone: '+91 90000 00000',
  role: 'admin',
  status: 'Approved',
  city: 'Headquarters',
  address: 'Community Care Central Office',
  createdAt: new Date().toISOString()
};

const DONATION_CATEGORIES = [
  'Food and groceries',
  'Clothes',
  'Books and educational materials',
  'Medicines and medical essentials',
  'Furniture',
  'Household essentials',
  'Electronics',
  'Other useful items'
];

const VOLUNTEER_STATUS_FLOW = [
  'Volunteer Assigned',
  'Pickup Scheduled',
  'Arrived at Pickup Location',
  'Collected',
  'At Collection Centre',
  'Ready for Delivery',
  'In Transit',
  'Delivered'
];

function loadStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage error:', e);
  }
}

// ============================================================================
// STRICT NAVY, GREEN (APPROVED/COMPLETED) & RED (REJECTED/CANCELLED) BADGES
// ============================================================================
function StatusBadge({ status }) {
  const greenStatuses = ['Approved', 'Completed', 'Receipt Confirmed', 'Resolved'];
  const redStatuses = ['Rejected', 'Cancelled', 'Suspended', 'Issue Reported', 'Open'];

  let cls = 'bg-[#0A192F]/10 text-[#0A192F] border-[#0A192F]/25';
  if (greenStatuses.includes(status)) {
    cls = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  } else if (redStatuses.includes(status)) {
    cls = 'bg-red-50 text-red-700 border-red-300';
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${cls}`}>
      {status}
    </span>
  );
}

// ============================================================================
// MAIN APPLICATION
// ============================================================================
export default function App() {
  // Ensure Tailwind CSS & Full-Screen Reset are always active
  useEffect(() => {
    if (!document.getElementById('tailwind-cdn-script')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn-script';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  const [users, setUsers] = useState(() => {
    const existing = loadStorage(STORAGE_KEYS.USERS, null);
    if (!existing || existing.length === 0) {
      saveStorage(STORAGE_KEYS.USERS, [INITIAL_ADMIN]);
      return [INITIAL_ADMIN];
    }
    return existing;
  });

  const [donations, setDonations] = useState(() => loadStorage(STORAGE_KEYS.DONATIONS, []));
  const [requests, setRequests] = useState(() => loadStorage(STORAGE_KEYS.REQUESTS, []));
  const [timeline, setTimeline] = useState(() => loadStorage(STORAGE_KEYS.TIMELINE, []));
  const [notifications, setNotifications] = useState(() => loadStorage(STORAGE_KEYS.NOTIFICATIONS, []));
  const [complaints, setComplaints] = useState(() => loadStorage(STORAGE_KEYS.COMPLAINTS, []));
  const [sessionUserId, setSessionUserId] = useState(() => loadStorage(STORAGE_KEYS.SESSION, null));

  useEffect(() => { saveStorage(STORAGE_KEYS.USERS, users); }, [users]);
  useEffect(() => { saveStorage(STORAGE_KEYS.DONATIONS, donations); }, [donations]);
  useEffect(() => { saveStorage(STORAGE_KEYS.REQUESTS, requests); }, [requests]);
  useEffect(() => { saveStorage(STORAGE_KEYS.TIMELINE, timeline); }, [timeline]);
  useEffect(() => { saveStorage(STORAGE_KEYS.NOTIFICATIONS, notifications); }, [notifications]);
  useEffect(() => { saveStorage(STORAGE_KEYS.COMPLAINTS, complaints); }, [complaints]);
  useEffect(() => { saveStorage(STORAGE_KEYS.SESSION, sessionUserId); }, [sessionUserId]);

  useEffect(() => {
    const handleStorage = () => {
      setUsers(loadStorage(STORAGE_KEYS.USERS, [INITIAL_ADMIN]));
      setDonations(loadStorage(STORAGE_KEYS.DONATIONS, []));
      setRequests(loadStorage(STORAGE_KEYS.REQUESTS, []));
      setTimeline(loadStorage(STORAGE_KEYS.TIMELINE, []));
      setNotifications(loadStorage(STORAGE_KEYS.NOTIFICATIONS, []));
      setComplaints(loadStorage(STORAGE_KEYS.COMPLAINTS, []));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const currentUser = useMemo(
    () => users.find(u => u.id === sessionUserId) || null,
    [users, sessionUserId]
  );

  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);
  const [proofModalDonation, setProofModalDonation] = useState(null);
  const [issueModalDonation, setIssueModalDonation] = useState(null);
  const [receiptModalDonation, setReceiptModalDonation] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ============================================================================
  // SHARED TIMELINE & NOTIFICATION ENGINE
  // ============================================================================
  const recordTimelineEvent = ({
    donationId = null,
    requestId = null,
    actorId,
    actorName,
    actorRole,
    eventType,
    prevStatus = null,
    newStatus = null,
    description,
    location = '',
    proofUrl = ''
  }) => {
    const newEvent = {
      id: `EVT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      donationId,
      requestId,
      actorId,
      actorName,
      actorRole,
      eventType,
      prevStatus,
      newStatus,
      description,
      location,
      proofUrl,
      timestamp: new Date().toISOString()
    };
    setTimeline(prev => [newEvent, ...prev]);
    return newEvent;
  };

  const sendNotification = ({
    recipientId,
    title,
    message,
    type = 'info',
    relatedId = null,
    targetTab = null
  }) => {
    const notif = {
      id: `NTF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      recipientId,
      title,
      message,
      type,
      relatedId,
      targetTab,
      read: false,
      createdAt: new Date().toISOString()
    };
    setNotifications(prev => [notif, ...prev]);
  };

  const notifyAdmins = ({ title, message, relatedId = null, targetTab = null }) => {
    users.filter(u => u.role === 'admin').forEach(admin => {
      sendNotification({
        recipientId: admin.id,
        title,
        message,
        type: 'admin',
        relatedId,
        targetTab
      });
    });
  };

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================
  const handleLogin = (email, password) => {
    const found = users.find(
      u => u.email.toLowerCase() === email.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      showToast('Invalid email address or password.', 'error');
      return false;
    }
    setSessionUserId(found.id);
    setActiveTab('Dashboard');
    showToast(`Welcome, ${found.fullName}!`);
    return true;
  };

  const handleRegister = (formData) => {
    const exists = users.some(
      u => u.email.toLowerCase() === formData.email.trim().toLowerCase()
    );
    if (exists) {
      showToast('An account with this email already exists.', 'error');
      return false;
    }

    const prefix = formData.role === 'donor' ? 'DONOR' : formData.role === 'volunteer' ? 'VOL' : 'REC';
    const newUser = {
      id: `${prefix}-${Date.now().toString().slice(-4)}`,
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      phone: formData.phone.trim(),
      role: formData.role,
      organizationType: formData.organizationType || 'Individual',
      city: formData.city.trim(),
      address: formData.address.trim(),
      status: 'Pending Approval',
      rejectionReason: '',
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);

    recordTimelineEvent({
      actorId: newUser.id,
      actorName: newUser.fullName,
      actorRole: newUser.role,
      eventType: 'Account Registration',
      prevStatus: 'None',
      newStatus: 'Pending Approval',
      description: `${newUser.fullName} registered as a ${newUser.role.toUpperCase()} and is awaiting admin verification.`,
      location: newUser.city
    });

    notifyAdmins({
      title: `New ${newUser.role} registration awaiting approval`,
      message: `${newUser.fullName} (${newUser.email}) registered as a ${newUser.role}.`,
      relatedId: newUser.id,
      targetTab: 'Pending Approvals'
    });

    setSessionUserId(newUser.id);
    showToast('Registration submitted! Awaiting administrator verification.');
    return true;
  };

  const handleLogout = () => {
    setSessionUserId(null);
    setActiveTab('Dashboard');
    setSearchQuery('');
  };

  // ============================================================================
  // ADMIN USER APPROVAL & MODERATION
  // ============================================================================
  const handleAdminUserStatus = (targetUserId, newStatus, reason = '') => {
    const target = users.find(u => u.id === targetUserId);
    if (!target) return;

    setUsers(prev =>
      prev.map(u =>
        u.id === targetUserId
          ? { ...u, status: newStatus, rejectionReason: reason }
          : u
      )
    );

    recordTimelineEvent({
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'admin',
      eventType: `Account ${newStatus}`,
      prevStatus: target.status,
      newStatus,
      description: `Admin updated ${target.fullName} (${target.role}) account status to ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
      location: target.city
    });

    sendNotification({
      recipientId: target.id,
      title: `Account ${newStatus}`,
      message:
        newStatus === 'Approved'
          ? 'Your Community Care account has been verified and approved! You now have full access.'
          : `Your account status was updated to ${newStatus}.${reason ? ` Reason: ${reason}` : ''}`,
      type: newStatus === 'Approved' ? 'success' : 'error'
    });

    showToast(
      `User ${target.fullName} marked as ${newStatus}.`,
      newStatus === 'Approved' ? 'success' : 'error'
    );
  };

  // ============================================================================
  // DONOR ACTIONS
  // ============================================================================
  const handleCreateDonation = (data) => {
    const newDonation = {
      id: `DON-${Date.now().toString().slice(-4)}`,
      donorId: currentUser.id,
      donorName: currentUser.fullName,
      donorPhone: currentUser.phone,
      title: data.title.trim(),
      category: data.category,
      itemName: data.itemName.trim(),
      description: data.description.trim(),
      quantity: Number(data.quantity),
      unit: data.unit.trim(),
      condition: data.condition,
      photos: data.photos.length > 0 ? data.photos : [],
      pickupAddress: data.pickupAddress.trim(),
      city: data.city.trim(),
      pickupDateTime: data.pickupDateTime,
      pickupInstructions: data.pickupInstructions.trim(),
      priority: data.priority,
      expiryDate: data.expiryDate || null,
      notes: data.notes.trim(),
      status: 'Awaiting Volunteer',
      volunteerId: null,
      volunteerName: null,
      volunteerPhone: null,
      receiverId: null,
      receiverName: null,
      deliveryAddress: 'Assigned upon Receiver Match',
      proofPhoto: null,
      proofNotes: '',
      createdAt: new Date().toISOString()
    };

    setDonations(prev => [newDonation, ...prev]);

    recordTimelineEvent({
      donationId: newDonation.id,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'donor',
      eventType: 'Donation Published',
      prevStatus: 'Draft',
      newStatus: 'Awaiting Volunteer',
      description: `Donor ${currentUser.fullName} published "${newDonation.title}" (${newDonation.quantity} ${newDonation.unit}).`,
      location: newDonation.city
    });

    sendNotification({
      recipientId: currentUser.id,
      title: 'Donation Published Successfully',
      message: 'Your donation has been posted successfully! We will notify you when a volunteer accepts your donation.',
      relatedId: newDonation.id,
      targetTab: 'My Donations'
    });

    users.filter(u => u.role === 'volunteer' && u.status === 'Approved').forEach(vol => {
      sendNotification({
        recipientId: vol.id,
        title: 'New Donation Available for Pickup',
        message: `"${newDonation.title}" is available for pickup in ${newDonation.city}.`,
        relatedId: newDonation.id,
        targetTab: 'Available Donations'
      });
    });

    notifyAdmins({
      title: 'New Donation Posted',
      message: `${currentUser.fullName} posted "${newDonation.title}" (${newDonation.id}).`,
      relatedId: newDonation.id,
      targetTab: 'Donation Management'
    });

    showToast('Your donation has been posted successfully!');
    setActiveTab('My Donations');
  };

  const handleCancelDonation = (donationId) => {
    const target = donations.find(d => d.id === donationId);
    if (!target) return;

    setDonations(prev =>
      prev.map(d => (d.id === donationId ? { ...d, status: 'Cancelled' } : d))
    );

    recordTimelineEvent({
      donationId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      eventType: 'Donation Cancelled',
      prevStatus: target.status,
      newStatus: 'Cancelled',
      description: `Donation "${target.title}" was cancelled by ${currentUser.fullName}.`,
      location: target.city
    });

    showToast(`Donation ${donationId} cancelled.`, 'error');
  };

  // ============================================================================
  // VOLUNTEER ACTIONS
  // ============================================================================
  const handleVolunteerAccept = (donationId) => {
    const target = donations.find(d => d.id === donationId);
    if (!target) return;
    if (target.volunteerId || target.status !== 'Awaiting Volunteer') {
      showToast('This donation has already been accepted by another volunteer.', 'error');
      return;
    }

    setDonations(prev =>
      prev.map(d =>
        d.id === donationId
          ? {
              ...d,
              status: 'Volunteer Assigned',
              volunteerId: currentUser.id,
              volunteerName: currentUser.fullName,
              volunteerPhone: currentUser.phone
            }
          : d
      )
    );

    recordTimelineEvent({
      donationId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'volunteer',
      eventType: 'Volunteer Accepted Task',
      prevStatus: 'Awaiting Volunteer',
      newStatus: 'Volunteer Assigned',
      description: `Volunteer ${currentUser.fullName} accepted pickup assignment for "${target.title}".`,
      location: target.city
    });

    sendNotification({
      recipientId: target.donorId,
      title: 'Volunteer Assigned to Your Donation',
      message: `Volunteer ${currentUser.fullName} has accepted your donation "${target.title}" (${target.id}).`,
      relatedId: donationId,
      targetTab: 'My Donations'
    });

    sendNotification({
      recipientId: currentUser.id,
      title: 'Donation Pickup Accepted',
      message: `You have been assigned to collect "${target.title}" (${target.id}).`,
      relatedId: donationId,
      targetTab: 'My Assigned Tasks'
    });

    notifyAdmins({
      title: 'Volunteer Accepted Donation Task',
      message: `${currentUser.fullName} accepted donation ${target.id}.`,
      relatedId: donationId,
      targetTab: 'Volunteer Assignments'
    });

    showToast(`Task ${donationId} accepted! View it in My Assigned Tasks.`);
  };

  const handleVolunteerStatusUpdate = (donationId, nextStatus, proofPhoto = null, proofNotes = '') => {
    const target = donations.find(d => d.id === donationId);
    if (!target) return;

    setDonations(prev =>
      prev.map(d =>
        d.id === donationId
          ? {
              ...d,
              status: nextStatus,
              proofPhoto: proofPhoto || d.proofPhoto,
              proofNotes: proofNotes || d.proofNotes
            }
          : d
      )
    );

    recordTimelineEvent({
      donationId,
      requestId: target.matchedRequestId || null,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      eventType: `Status Updated: ${nextStatus}`,
      prevStatus: target.status,
      newStatus: nextStatus,
      description: `Volunteer ${currentUser.fullName} updated "${target.title}" to "${nextStatus}".${proofNotes ? ` Notes: ${proofNotes}` : ''}`,
      location: target.city,
      proofUrl: proofPhoto || ''
    });

    sendNotification({
      recipientId: target.donorId,
      title: `Donation Update: ${nextStatus}`,
      message: `Your donation "${target.title}" (${target.id}) is now marked as "${nextStatus}".`,
      relatedId: donationId,
      targetTab: 'Donation Timeline'
    });

    if (target.receiverId) {
      sendNotification({
        recipientId: target.receiverId,
        title: nextStatus === 'Delivered' ? 'Donation Arrived — Please Confirm Receipt' : `Delivery Update: ${nextStatus}`,
        message:
          nextStatus === 'Delivered'
            ? `"${target.title}" has been delivered by Volunteer ${currentUser.fullName}. Please inspect and confirm receipt.`
            : `Your matched donation "${target.title}" status is now "${nextStatus}".`,
        relatedId: donationId,
        targetTab: 'Assigned Donations'
      });
    }

    showToast(`Status updated to "${nextStatus}".`);
  };

  // ============================================================================
  // RECEIVER ACTIONS
  // ============================================================================
  const handleCreateRequest = (data) => {
    const newReq = {
      id: `REQ-${Date.now().toString().slice(-4)}`,
      receiverId: currentUser.id,
      receiverName: currentUser.fullName,
      receiverPhone: currentUser.phone,
      organizationType: currentUser.organizationType || 'Individual',
      title: data.title.trim(),
      category: data.category,
      description: data.description.trim(),
      quantity: Number(data.quantity),
      reason: data.reason.trim(),
      beneficiaries: Number(data.beneficiaries) || 1,
      urgency: data.urgency,
      deliveryAddress: data.deliveryAddress.trim(),
      city: data.city.trim(),
      preferredDate: data.preferredDate,
      status: 'Pending Review',
      matchedDonationId: null,
      createdAt: new Date().toISOString()
    };

    setRequests(prev => [newReq, ...prev]);

    recordTimelineEvent({
      requestId: newReq.id,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'receiver',
      eventType: 'Request Submitted',
      prevStatus: 'Draft',
      newStatus: 'Pending Review',
      description: `Receiver ${currentUser.fullName} submitted request "${newReq.title}" (${newReq.quantity} items).`,
      location: newReq.city
    });

    sendNotification({
      recipientId: currentUser.id,
      title: 'Request Submitted Successfully',
      message: `Your request "${newReq.title}" (${newReq.id}) is now Pending Review by an administrator.`,
      relatedId: newReq.id,
      targetTab: 'My Requests'
    });

    notifyAdmins({
      title: 'New Receiver Request Submitted',
      message: `${currentUser.fullName} submitted request "${newReq.title}" (${newReq.id}).`,
      relatedId: newReq.id,
      targetTab: 'Donation Requests'
    });

    showToast('Request submitted successfully!');
    setActiveTab('My Requests');
  };

  const handleConfirmReceipt = (donationId, feedbackNote, hasIssue = false) => {
    const target = donations.find(d => d.id === donationId);
    if (!target) return;

    if (hasIssue) {
      const issue = {
        id: `CMP-${Date.now().toString().slice(-4)}`,
        donationId,
        reporterId: currentUser.id,
        reporterName: currentUser.fullName,
        reporterRole: currentUser.role,
        reason: feedbackNote || 'Missing or damaged items reported upon delivery.',
        status: 'Open',
        createdAt: new Date().toISOString()
      };
      setComplaints(prev => [issue, ...prev]);
      setDonations(prev =>
        prev.map(d => (d.id === donationId ? { ...d, status: 'Issue Reported' } : d))
      );

      recordTimelineEvent({
        donationId,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.role,
        eventType: 'Issue Reported',
        prevStatus: target.status,
        newStatus: 'Issue Reported',
        description: `${currentUser.fullName} reported an issue on ${donationId}: ${feedbackNote}`,
        location: target.city
      });

      notifyAdmins({
        title: `Issue Reported on ${donationId}`,
        message: `${currentUser.fullName} reported: ${feedbackNote}`,
        relatedId: donationId,
        targetTab: 'Complaints & Disputes'
      });

      showToast('Issue recorded and escalated to Administrators.', 'error');
      return;
    }

    setDonations(prev =>
      prev.map(d =>
        d.id === donationId
          ? {
              ...d,
              status: 'Completed',
              confirmedAt: new Date().toISOString(),
              receiverFeedback: feedbackNote
            }
          : d
      )
    );

    if (target.matchedRequestId) {
      setRequests(prev =>
        prev.map(r =>
          r.id === target.matchedRequestId ? { ...r, status: 'Completed' } : r
        )
      );
    }

    recordTimelineEvent({
      donationId,
      requestId: target.matchedRequestId || null,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'receiver',
      eventType: 'Receiver Confirmed Receipt — Completed',
      prevStatus: target.status,
      newStatus: 'Completed',
      description: `Receiver ${currentUser.fullName} confirmed safe receipt of "${target.title}". ${feedbackNote ? `Note: "${feedbackNote}"` : ''}`,
      location: target.city
    });

    sendNotification({
      recipientId: target.donorId,
      title: 'Donation Successfully Delivered!',
      message:
        "Congratulations! Your donation has been successfully delivered. Thank you for making a difference in someone's life. Keep spreading kindness through Community Care!",
      type: 'success',
      relatedId: donationId,
      targetTab: 'Donation History'
    });

    if (target.volunteerId) {
      sendNotification({
        recipientId: target.volunteerId,
        title: 'Delivery Verified & Completed!',
        message: `${currentUser.fullName} confirmed receipt of "${target.title}" (${donationId}). Task marked Completed!`,
        type: 'success',
        relatedId: donationId,
        targetTab: 'Completed Tasks'
      });
    }

    notifyAdmins({
      title: `Donation ${donationId} Completed`,
      message: `Receiver ${currentUser.fullName} confirmed receipt of ${donationId}.`,
      relatedId: donationId,
      targetTab: 'Donation Management'
    });

    showToast('Receipt confirmed! Donation marked Completed.');
  };

  // ============================================================================
  // ADMIN REQUEST & MATCHING ACTIONS
  // ============================================================================
  const handleAdminRequestDecision = (requestId, decision) => {
    const req = requests.find(r => r.id === requestId);
    if (!req) return;

    setRequests(prev =>
      prev.map(r => (r.id === requestId ? { ...r, status: decision } : r))
    );

    recordTimelineEvent({
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: 'admin',
      eventType: `Request ${decision}`,
      prevStatus: req.status,
      newStatus: decision,
      description: `Administrator marked request "${req.title}" (${req.id}) as ${decision}.`,
      location: req.city
    });

    sendNotification({
      recipientId: req.receiverId,
      title: `Your Request was ${decision}`,
      message: `Your donation request "${req.title}" (${req.id}) has been marked as ${decision}.`,
      relatedId: req.id,
      targetTab: 'My Requests'
    });

    showToast(
      `Request ${requestId} marked as ${decision}.`,
      decision === 'Approved' ? 'success' : 'error'
    );
  };

  const handleMatchDonationToReceiver = (donationId, receiverUserId, requestId = null) => {
    const donation = donations.find(d => d.id === donationId);
    const receiver = users.find(u => u.id === receiverUserId);
    if (!donation || !receiver) return;

    setDonations(prev =>
      prev.map(d =>
        d.id === donationId
          ? {
              ...d,
              receiverId: receiver.id,
              receiverName: receiver.fullName,
              deliveryAddress: receiver.address || receiver.city,
              matchedRequestId: requestId || d.matchedRequestId
            }
          : d
      )
    );

    if (requestId) {
      setRequests(prev =>
        prev.map(r =>
          r.id === requestId
            ? { ...r, status: 'Approved', matchedDonationId: donationId }
            : r
        )
      );
    }

    recordTimelineEvent({
      donationId,
      requestId,
      actorId: currentUser.id,
      actorName: currentUser.fullName,
      actorRole: currentUser.role,
      eventType: 'Receiver Matched',
      prevStatus: donation.status,
      newStatus: donation.status,
      description: `Donation "${donation.title}" (${donation.id}) matched with Receiver ${receiver.fullName}.`,
      location: receiver.city
    });

    sendNotification({
      recipientId: receiver.id,
      title: 'A Donation Has Been Matched to You',
      message: `Donation "${donation.title}" (${donation.id}) has been assigned for delivery to you.`,
      relatedId: donationId,
      targetTab: 'Assigned Donations'
    });

    showToast(`Matched donation ${donation.id} to ${receiver.fullName}.`);
  };

  // ============================================================================
  // GLOBAL FULL-SCREEN STYLE OVERRIDE (ELIMINATES ALL VITE SIDE GAPS)
  // ============================================================================
  const FullScreenReset = (
    <style>{`
      html, body, #root {
        width: 100% !important;
        max-width: 100% !important;
        min-height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        display: block !important;
        background-color: #F8FAFC !important;
        color: #0A192F !important;
        font-family: Inter, system-ui, -apple-system, sans-serif !important;
      }
      * {
        box-sizing: border-box;
      }
    `}</style>
  );

  if (!currentUser) {
    return (
      <>
        {FullScreenReset}
        {toast && <ToastBanner toast={toast} />}
        <AuthPortal onLogin={handleLogin} onRegister={handleRegister} />
      </>
    );
  }

  if (currentUser.role !== 'admin' && currentUser.status !== 'Approved') {
    return (
      <>
        {FullScreenReset}
        {toast && <ToastBanner toast={toast} />}
        <AccountStatusGate user={currentUser} onLogout={handleLogout} />
      </>
    );
  }

  const roleNavItems = {
    donor: [
      { label: 'Dashboard', icon: Activity },
      { label: 'Create Donation', icon: PlusCircle },
      { label: 'My Donations', icon: Package },
      { label: 'Donation Timeline', icon: Clock },
      { label: 'Available Requests', icon: Heart },
      { label: 'Notifications', icon: Bell },
      { label: 'Donation History', icon: ClipboardList },
      { label: 'My Impact', icon: Award },
      { label: 'My Profile', icon: User },
      { label: 'Help & Support', icon: HelpCircle }
    ],
    volunteer: [
      { label: 'Dashboard', icon: Activity },
      { label: 'My Timeline', icon: Clock },
      { label: 'Available Donations', icon: Package },
      { label: 'Available Requests', icon: Heart },
      { label: 'My Assigned Tasks', icon: Truck },
      { label: 'Pickup Schedule', icon: Calendar },
      { label: 'Delivery Tracking', icon: MapPin },
      { label: 'Completed Tasks', icon: CheckCircle2 },
      { label: 'Notifications', icon: Bell },
      { label: 'My Impact', icon: Award },
      { label: 'My Profile', icon: User },
      { label: 'Help & Support', icon: HelpCircle }
    ],
    receiver: [
      { label: 'Dashboard', icon: Activity },
      { label: 'Browse Available Donations', icon: Package },
      { label: 'Request Donation', icon: PlusCircle },
      { label: 'My Requests', icon: FileText },
      { label: 'Request Timeline', icon: Clock },
      { label: 'Assigned Donations', icon: Truck },
      { label: 'Delivery Tracking', icon: MapPin },
      { label: 'Received Donations', icon: CheckCircle2 },
      { label: 'Notifications', icon: Bell },
      { label: 'My Profile', icon: User },
      { label: 'Help & Support', icon: HelpCircle }
    ],
    admin: [
      { label: 'Dashboard', icon: Activity },
      { label: 'Pending Approvals', icon: ShieldCheck },
      { label: 'User Management', icon: Users },
      { label: 'Donation Management', icon: Package },
      { label: 'Donation Requests', icon: FileText },
      { label: 'Volunteer Assignments', icon: Truck },
      { label: 'Global Timeline', icon: Clock },
      { label: 'Complaints & Disputes', icon: AlertOctagon },
      { label: 'Notifications', icon: Bell },
      { label: 'My Profile', icon: User }
    ]
  };

  const navList = roleNavItems[currentUser.role] || roleNavItems.donor;
  const userNotifications = notifications.filter(n => n.recipientId === currentUser.id);
  const unreadCount = userNotifications.filter(n => !n.read).length;

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] text-[#0A192F] flex">
      {FullScreenReset}
      {toast && <ToastBanner toast={toast} />}

      {/* FULL-HEIGHT DEEP NAVY BLUE SIDEBAR */}
      <aside className="w-64 bg-[#0A192F] text-white flex flex-col shrink-0 min-h-screen border-r border-[#112240]">
        <div className="p-5 border-b border-[#112240] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#0A192F] flex items-center justify-center font-bold shadow">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold tracking-tight text-base text-white">COMMUNITY CARE</div>
            <div className="text-[11px] text-slate-300 uppercase tracking-wider font-semibold">
              {currentUser.role} Portal
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navList.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.label;
            const badgeCount =
              item.label === 'Pending Approvals'
                ? users.filter(u => u.status === 'Pending Approval').length
                : item.label === 'Notifications'
                ? unreadCount
                : 0;

            return (
              <button
                key={item.label}
                onClick={() => setActiveTab(item.label)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-[#0A192F] shadow-sm'
                    : 'text-slate-300 hover:bg-[#112240] hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </span>
                {badgeCount > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs rounded-full font-bold ${
                      isActive ? 'bg-[#0A192F] text-white' : 'bg-white text-[#0A192F]'
                    }`}
                  >
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#112240] bg-[#071120]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-white text-[#0A192F] flex items-center justify-center font-bold text-xs uppercase">
              {currentUser.fullName.slice(0, 2)}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-white truncate">{currentUser.fullName}</div>
              <div className="text-xs text-emerald-400 font-semibold">{currentUser.status}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN FULL-WIDTH WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* TOP WHITE HEADER */}
        <header className="w-full bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0A192F]">{activeTab}</h1>
            <p className="text-xs text-slate-500">
              Logged in as <span className="font-bold text-[#0A192F]">{currentUser.fullName}</span> • {currentUser.role.toUpperCase()} • {currentUser.city}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search ID, title, city, category..."
                className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0A192F] w-64 bg-white"
              />
            </div>

            <button
              onClick={() => setActiveTab('Notifications')}
              className="relative p-2.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-[#0A192F]"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('My Profile')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-xs font-bold uppercase">
                {currentUser.fullName.slice(0, 2)}
              </div>
              <div className="hidden sm:block">
                <div className="text-xs font-bold text-[#0A192F]">{currentUser.fullName}</div>
                <div className="text-[10px] text-slate-500 uppercase font-semibold">{currentUser.role}</div>
              </div>
            </button>
          </div>
        </header>

        {/* PAGE BODY */}
        <main className="p-8 flex-1 overflow-y-auto w-full space-y-6">
          {activeTab === 'Notifications' && (
            <NotificationsView
              notifications={userNotifications}
              onMarkRead={id =>
                setNotifications(prev =>
                  prev.map(n => (n.id === id ? { ...n, read: true } : n))
                )
              }
              onMarkAllRead={() =>
                setNotifications(prev =>
                  prev.map(n =>
                    n.recipientId === currentUser.id ? { ...n, read: true } : n
                  )
                )
              }
              onNavigate={tab => tab && setActiveTab(tab)}
            />
          )}

          {activeTab === 'My Profile' && (
            <ProfileView
              user={currentUser}
              onUpdateProfile={updated => {
                setUsers(prev =>
                  prev.map(u => (u.id === currentUser.id ? { ...u, ...updated } : u))
                );
                recordTimelineEvent({
                  actorId: currentUser.id,
                  actorName: updated.fullName || currentUser.fullName,
                  actorRole: currentUser.role,
                  eventType: 'Profile Updated',
                  prevStatus: 'Approved',
                  newStatus: 'Approved',
                  description: `${updated.fullName || currentUser.fullName} updated their profile details.`,
                  location: updated.city || currentUser.city
                });
                showToast('Profile updated successfully!');
              }}
            />
          )}

          {activeTab === 'Help & Support' && (
            <HelpSupportView
              onSubmitTicket={reason => {
                const newCmp = {
                  id: `SUP-${Date.now().toString().slice(-4)}`,
                  donationId: 'General Support',
                  reporterId: currentUser.id,
                  reporterName: currentUser.fullName,
                  reporterRole: currentUser.role,
                  reason,
                  status: 'Open',
                  createdAt: new Date().toISOString()
                };
                setComplaints(prev => [newCmp, ...prev]);
                notifyAdmins({
                  title: 'New Support Ticket',
                  message: `${currentUser.fullName} submitted a support request.`,
                  targetTab: 'Complaints & Disputes'
                });
                showToast('Support ticket submitted to Administrators.');
              }}
            />
          )}

          {currentUser.role === 'donor' &&
            !['Notifications', 'My Profile', 'Help & Support'].includes(activeTab) && (
              <DonorPortal
                user={currentUser}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                donations={donations}
                requests={requests}
                timeline={timeline}
                searchQuery={searchQuery}
                onCreateDonation={handleCreateDonation}
                onCancelDonation={handleCancelDonation}
                onInspect={setInspectItem}
              />
            )}

          {currentUser.role === 'volunteer' &&
            !['Notifications', 'My Profile', 'Help & Support'].includes(activeTab) && (
              <VolunteerPortal
                user={currentUser}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                donations={donations}
                requests={requests}
                timeline={timeline}
                searchQuery={searchQuery}
                onAcceptDonation={handleVolunteerAccept}
                onUpdateStatus={handleVolunteerStatusUpdate}
                onOpenProofModal={setProofModalDonation}
                onOpenIssueModal={setIssueModalDonation}
                onInspect={setInspectItem}
              />
            )}

          {currentUser.role === 'receiver' &&
            !['Notifications', 'My Profile', 'Help & Support'].includes(activeTab) && (
              <ReceiverPortal
                user={currentUser}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                donations={donations}
                requests={requests}
                timeline={timeline}
                searchQuery={searchQuery}
                onCreateRequest={handleCreateRequest}
                onClaimDonation={donationId =>
                  handleMatchDonationToReceiver(donationId, currentUser.id)
                }
                onOpenReceiptModal={setReceiptModalDonation}
                onInspect={setInspectItem}
              />
            )}

          {currentUser.role === 'admin' &&
            !['Notifications', 'My Profile', 'Help & Support'].includes(activeTab) && (
              <AdminPortal
                users={users}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                donations={donations}
                requests={requests}
                timeline={timeline}
                complaints={complaints}
                searchQuery={searchQuery}
                onUpdateUserStatus={handleAdminUserStatus}
                onDecisionRequest={handleAdminRequestDecision}
                onMatchDonation={handleMatchDonationToReceiver}
                onCancelDonation={handleCancelDonation}
                onResolveComplaint={cmpId => {
                  setComplaints(prev =>
                    prev.map(c => (c.id === cmpId ? { ...c, status: 'Resolved' } : c))
                  );
                  showToast('Complaint marked as Resolved.');
                }}
                onInspect={setInspectItem}
              />
            )}
        </main>
      </div>

      {/* MODALS */}
      {inspectItem && (
        <InspectModal
          item={inspectItem}
          timeline={timeline}
          onClose={() => setInspectItem(null)}
        />
      )}

      {proofModalDonation && (
        <ProofUploadModal
          donation={proofModalDonation}
          onClose={() => setProofModalDonation(null)}
          onSubmit={(photoUrl, notes) => {
            handleVolunteerStatusUpdate(
              proofModalDonation.id,
              'Delivered',
              photoUrl,
              notes
            );
            setProofModalDonation(null);
          }}
        />
      )}

      {issueModalDonation && (
        <IssueReportModal
          donation={issueModalDonation}
          onClose={() => setIssueModalDonation(null)}
          onSubmit={reason => {
            handleConfirmReceipt(issueModalDonation.id, reason, true);
            setIssueModalDonation(null);
          }}
        />
      )}

      {receiptModalDonation && (
        <ReceiverConfirmModal
          donation={receiptModalDonation}
          onClose={() => setReceiptModalDonation(null)}
          onConfirm={(notes, hasIssue) => {
            handleConfirmReceipt(receiptModalDonation.id, notes, hasIssue);
            setReceiptModalDonation(null);
          }}
        />
      )}
    </div>
  );
}

// ============================================================================
// FULL-SCREEN PROFESSIONAL AUTHENTICATION PORTAL (NAVY BLUE & WHITE)
// ============================================================================
function AuthPortal({ onLogin, onRegister }) {
  const [mode, setMode] = useState('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);

  const [regForm, setRegForm] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: '',
    role: 'donor',
    organizationType: 'Individual',
    city: '',
    address: ''
  });

  const handleLoginSubmit = e => {
    e.preventDefault();
    onLogin(loginEmail, loginPassword);
  };

  const handleRegSubmit = e => {
    e.preventDefault();
    if (!regForm.fullName || !regForm.email || !regForm.password || !regForm.phone || !regForm.city) {
      return;
    }
    onRegister(regForm);
  };

  return (
    <div className="w-full min-h-screen bg-[#0A192F] flex flex-col lg:flex-row">
      {/* Left Brand Panel */}
      <div className="lg:w-1/2 p-10 lg:p-16 flex flex-col justify-between text-white border-b lg:border-b-0 lg:border-r border-[#112240]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-white text-[#0A192F] flex items-center justify-center font-bold shadow">
            <Heart className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xl font-bold tracking-tight">COMMUNITY CARE</div>
            <div className="text-xs text-slate-300 uppercase tracking-widest">
              Donation Management Platform
            </div>
          </div>
        </div>

        <div className="my-12 space-y-5 max-w-lg">
          <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight">
            Connecting Donors, Volunteers & Receivers on One Unified Platform.
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Every donation post, volunteer pickup, delivery milestone, and receiver confirmation is tracked in real time through our shared Donation Timeline Engine.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-4 rounded-xl bg-[#112240] border border-slate-700">
              <div className="text-sm font-bold text-white">Role-Based Portals</div>
              <div className="text-xs text-slate-300 mt-1">Dedicated workspaces for Donors, Volunteers, Receivers & Admins.</div>
            </div>
            <div className="p-4 rounded-xl bg-[#112240] border border-slate-700">
              <div className="text-sm font-bold text-white">Verified Handover</div>
              <div className="text-xs text-slate-300 mt-1">Admin account verification, photo proof, and receipt confirmation.</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          © {new Date().getFullYear()} Community Care Platform. All rights reserved.
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="lg:w-1/2 bg-white flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md space-y-6">
          <div className="grid grid-cols-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setResetSent(false); }}
              className={`py-3 text-sm font-bold border-b-2 transition ${
                mode === 'login'
                  ? 'border-[#0A192F] text-[#0A192F]'
                  : 'border-transparent text-slate-400 hover:text-[#0A192F]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setResetSent(false); }}
              className={`py-3 text-sm font-bold border-b-2 transition ${
                mode === 'register'
                  ? 'border-[#0A192F] text-[#0A192F]'
                  : 'border-transparent text-slate-400 hover:text-[#0A192F]'
              }`}
            >
              Register Account
            </button>
          </div>

          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-[#0A192F]">Welcome Back</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Sign in with your registered email and password to access your role dashboard.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0A192F]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-[#0A192F]"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[#0A192F] hover:underline font-bold"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className="text-slate-600 hover:text-[#0A192F] font-semibold"
                >
                  Create a new account →
                </button>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#0A192F] hover:bg-[#112240] text-white font-bold rounded-lg text-sm shadow transition"
              >
                Login to Dashboard
              </button>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div className="font-bold text-[#0A192F]">System Administrator Credentials:</div>
                <div>Email: <code className="font-mono font-bold">admin@communitycare.org</code></div>
                <div>Password: <code className="font-mono font-bold">Admin@123</code></div>
              </div>
            </form>
          )}

          {mode === 'register' && (
            <form onSubmit={handleRegSubmit} className="space-y-3.5">
              <div>
                <h2 className="text-xl font-bold text-[#0A192F]">Create Your Account</h2>
                <p className="text-xs text-slate-500">
                  Select your role below. New accounts are verified by the Administrator before activation.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] mb-1">
                  Select Role *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'donor', label: 'Donor' },
                    { id: 'volunteer', label: 'Volunteer' },
                    { id: 'receiver', label: 'Receiver' }
                  ].map(r => (
                    <button
                      type="button"
                      key={r.id}
                      onClick={() => setRegForm({ ...regForm, role: r.id })}
                      className={`py-2.5 px-3 rounded-lg text-xs font-bold border transition ${
                        regForm.role === r.id
                          ? 'bg-[#0A192F] text-white border-[#0A192F]'
                          : 'bg-white text-[#0A192F] border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] mb-1">
                  Full Name / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  value={regForm.fullName}
                  onChange={e => setRegForm({ ...regForm, fullName: e.target.value })}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A192F] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="you@example.com"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A192F] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={regForm.phone}
                    onChange={e => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0A192F] mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={regForm.password}
                  onChange={e => setRegForm({ ...regForm, password: e.target.value })}
                  placeholder="Create a password"
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0A192F] mb-1">
                    City / Area *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.city}
                    onChange={e => setRegForm({ ...regForm, city: e.target.value })}
                    placeholder="e.g. Chennai"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0A192F] mb-1">
                    Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={regForm.address}
                    onChange={e => setRegForm({ ...regForm, address: e.target.value })}
                    placeholder="Street & Door No"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 bg-[#0A192F] hover:bg-[#112240] text-white font-bold rounded-lg text-sm transition"
              >
                Register Account
              </button>
            </form>
          )}

          {mode === 'forgot' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-[#0A192F]">Reset Password</h3>
              {resetSent ? (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-800 font-semibold">
                  Password reset request recorded. Please contact the administrator or return to login.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setResetSent(true)}
                    className="w-full py-2.5 bg-[#0A192F] text-white rounded-lg text-sm font-bold"
                  >
                    Submit Reset Request
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full py-2 text-xs text-[#0A192F] font-bold"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PENDING / REJECTED / SUSPENDED ACCOUNT GATE
// ============================================================================
function AccountStatusGate({ user, onLogout }) {
  const isRejected = user.status === 'Rejected' || user.status === 'Suspended';
  return (
    <div className="w-full min-h-screen bg-[#0A192F] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-2xl border border-slate-200 p-8 text-center space-y-5">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
            isRejected ? 'bg-red-50 text-red-600' : 'bg-[#0A192F]/10 text-[#0A192F]'
          }`}
        >
          {isRejected ? <XCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
        </div>

        <StatusBadge status={user.status} />

        <h2 className="text-xl font-bold text-[#0A192F]">
          {user.status === 'Pending Approval'
            ? 'Account Awaiting Admin Verification'
            : `Account ${user.status}`}
        </h2>

        {user.status === 'Pending Approval' ? (
          <p className="text-sm text-slate-600 leading-relaxed">
            Your account is currently awaiting admin verification. You will be notified once your account is approved.
          </p>
        ) : (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 text-left space-y-1">
            <div className="font-bold">Reason / Status Note:</div>
            <div>{user.rejectionReason || 'Access restricted by administrator. Please contact support.'}</div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-700 space-y-1">
          <div><span className="font-bold text-[#0A192F]">Account ID:</span> {user.id}</div>
          <div><span className="font-bold text-[#0A192F]">Name:</span> {user.fullName}</div>
          <div><span className="font-bold text-[#0A192F]">Role:</span> {user.role.toUpperCase()}</div>
          <div><span className="font-bold text-[#0A192F]">Email:</span> {user.email}</div>
        </div>

        <button
          onClick={onLogout}
          className="w-full py-3 px-4 rounded-lg bg-[#0A192F] hover:bg-[#112240] text-white text-sm font-bold transition"
        >
          Back to Login Page
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 4. DONOR PORTAL — SUMMARY CARDS ONLY ON MAIN DASHBOARD PAGE
// ============================================================================
function DonorPortal({
  user,
  activeTab,
  setActiveTab,
  donations,
  requests,
  timeline,
  searchQuery,
  onCreateDonation,
  onCancelDonation,
  onInspect
}) {
  const myDonations = donations.filter(d => d.donorId === user.id);
  const [statusFilter, setStatusFilter] = useState('All Donations');

  const stats = {
    total: myDonations.length,
    active: myDonations.filter(d => !['Completed', 'Cancelled'].includes(d.status)).length,
    pendingVolunteer: myDonations.filter(d => d.status === 'Awaiting Volunteer').length,
    inTransit: myDonations.filter(d => ['Collected', 'In Transit', 'Ready for Delivery'].includes(d.status)).length,
    completed: myDonations.filter(d => d.status === 'Completed').length,
    cancelled: myDonations.filter(d => d.status === 'Cancelled').length
  };

  const myDonationIds = new Set(myDonations.map(d => d.id));
  const myTimeline = timeline.filter(
    e => (e.donationId && myDonationIds.has(e.donationId)) || e.actorId === user.id
  );

  // 1. MAIN DASHBOARD PAGE ONLY (Shows the 6 summary cards + quick overview)
  if (activeTab === 'Dashboard') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <SummaryCard label="Total Donations" value={stats.total} icon={Package} />
          <SummaryCard label="Active Donations" value={stats.active} icon={Activity} />
          <SummaryCard label="Pending Volunteer" value={stats.pendingVolunteer} icon={Clock} />
          <SummaryCard label="Donations In Transit" value={stats.inTransit} icon={Truck} />
          <SummaryCard label="Completed" value={stats.completed} icon={CheckCircle2} />
          <SummaryCard label="Cancelled" value={stats.cancelled} icon={XCircle} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0A192F]">Donor Workspace Overview</h2>
            <p className="text-xs text-slate-500">
              Publish new donations or track your active items through the real-time timeline.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('Create Donation')}
              className="px-4 py-2.5 rounded-lg bg-[#0A192F] hover:bg-[#112240] text-white text-xs font-bold"
            >
              + Create New Donation
            </button>
            <button
              onClick={() => setActiveTab('My Donations')}
              className="px-4 py-2.5 rounded-lg border border-[#0A192F] text-[#0A192F] hover:bg-slate-50 text-xs font-bold"
            >
              View My Donations
            </button>
          </div>
        </div>

        <SharedTimelineEngine
          title="Recent Donation Timeline Activity"
          subtitle="Latest updates across your published donations."
          events={myTimeline.slice(0, 5)}
        />
      </div>
    );
  }

  // 2. CREATE DONATION PAGE
  if (activeTab === 'Create Donation') {
    return <CreateDonationForm user={user} onSubmit={onCreateDonation} />;
  }

  // 3. DONATION TIMELINE PAGE
  if (activeTab === 'Donation Timeline') {
    return (
      <SharedTimelineEngine
        title="Complete Donation Journey Timeline"
        subtitle="Chronological history of all your donations."
        events={myTimeline}
      />
    );
  }

  // 4. AVAILABLE REQUESTS PAGE
  if (activeTab === 'Available Requests') {
    const openReqs = requests.filter(r => r.status !== 'Rejected');
    return (
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#0A192F]">Available Community Requests</h2>
            <p className="text-xs text-slate-500">Donation requests submitted by receivers and NGOs.</p>
          </div>
          <button
            onClick={() => setActiveTab('Create Donation')}
            className="px-4 py-2 bg-[#0A192F] text-white rounded-lg text-xs font-bold"
          >
            + Post Donation
          </button>
        </div>

        {openReqs.length === 0 ? (
          <EmptyState
            title="0 Community Requests"
            description="When receivers submit donation requests, they will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openReqs.map(req => (
              <div key={req.id} className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A192F]">{req.id} • {req.urgency}</span>
                  <StatusBadge status={req.status} />
                </div>
                <h3 className="font-bold text-[#0A192F]">{req.title}</h3>
                <p className="text-xs text-slate-600">{req.description}</p>
                <div className="text-xs text-slate-500 pt-2 border-t border-slate-100">
                  Category: <strong className="text-[#0A192F]">{req.category}</strong> • Qty: <strong className="text-[#0A192F]">{req.quantity}</strong> • City: <strong className="text-[#0A192F]">{req.city}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 5. DONATION HISTORY & MY IMPACT PAGES (No duplicate top dashboard cards)
  if (activeTab === 'Donation History' || activeTab === 'My Impact') {
    const completedList = myDonations.filter(d => d.status === 'Completed');
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#0A192F]">{activeTab}</h2>
          <p className="text-xs text-slate-500">
            Successfully delivered and receiver-confirmed donations ({completedList.length} completed).
          </p>
        </div>
        {completedList.length === 0 ? (
          <EmptyState
            title="0 Completed Donations Yet"
            description="Donations that are delivered and confirmed by the receiver will be listed here."
          />
        ) : (
          <div className="space-y-3">
            {completedList.map(d => (
              <div key={d.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0A192F]">{d.id} • {d.category}</div>
                  <div className="font-bold text-[#0A192F]">{d.title}</div>
                  <div className="text-xs text-slate-500">
                    Volunteer: {d.volunteerName || 'N/A'} • Receiver: {d.receiverName || 'Confirmed'}
                  </div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 6. MY DONATIONS PAGE (Dedicated table/card view without summary cards)
  const filteredDonations = myDonations.filter(d => {
    const matchesStatus = statusFilter === 'All Donations' || d.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-5">
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {[
            'All Donations',
            'Awaiting Volunteer',
            'Volunteer Assigned',
            'Pickup Scheduled',
            'Collected',
            'In Transit',
            'Delivered',
            'Completed',
            'Cancelled'
          ].map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-[#0A192F] text-white'
                  : 'bg-slate-100 text-[#0A192F] hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <button
          onClick={() => setActiveTab('Create Donation')}
          className="px-4 py-2 rounded-lg bg-[#0A192F] hover:bg-[#112240] text-white text-xs font-bold flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" />
          Post New Donation
        </button>
      </div>

      {filteredDonations.length === 0 ? (
        <EmptyState
          title="0 Donations in This View"
          description="No donation posts match the current filter."
          actionLabel="Create Donation"
          onAction={() => setActiveTab('Create Donation')}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonations.map(d => (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between space-y-4 shadow-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0A192F]">{d.id} • {d.priority} Priority</span>
                  <StatusBadge status={d.status} />
                </div>
                {d.photos && d.photos[0] && (
                  <img src={d.photos[0]} alt={d.title} className="w-full h-36 object-cover rounded-xl border border-slate-200" />
                )}
                <h3 className="font-bold text-[#0A192F] text-base">{d.title}</h3>
                <p className="text-xs text-slate-600">{d.description}</p>
                <div className="text-xs text-slate-500 space-y-1 pt-2 border-t border-slate-100">
                  <div>Category: <strong className="text-[#0A192F]">{d.category}</strong></div>
                  <div>Quantity: <strong className="text-[#0A192F]">{d.quantity} {d.unit}</strong></div>
                  <div>Volunteer: <strong className="text-[#0A192F]">{d.volunteerName || 'Awaiting Volunteer'}</strong></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
                <button
                  onClick={() => onInspect(d)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0A192F] hover:bg-slate-50"
                >
                  Inspect Timeline
                </button>
                {d.status === 'Awaiting Volunteer' && (
                  <button
                    onClick={() => onCancelDonation(d.id)}
                    className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                  >
                    Cancel Donation
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CREATE DONATION FORM
// ============================================================================
function CreateDonationForm({ user, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    category: DONATION_CATEGORIES[0],
    itemName: '',
    description: '',
    quantity: 1,
    unit: 'Items',
    condition: 'New / Unused',
    photos: [],
    pickupAddress: user.address || '',
    city: user.city || '',
    pickupDateTime: '',
    pickupInstructions: '',
    priority: 'Medium',
    expiryDate: '',
    notes: ''
  });
  const [error, setError] = useState('');

  const isPerishable =
    form.category === 'Food and groceries' ||
    form.category === 'Medicines and medical essentials';

  const handlePhotoUpload = e => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => {
        setForm(prev => ({
          ...prev,
          photos: [...prev.photos, ev.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = e => {
    e.preventDefault();
    setError('');

    if (!form.title || !form.itemName || !form.description || !form.pickupAddress || !form.city || !form.pickupDateTime) {
      setError('Please fill in all required fields.');
      return;
    }

    if (isPerishable) {
      if (!form.expiryDate) {
        setError('Expiry date is mandatory for Food and Medicines.');
        return;
      }
      if (new Date(form.expiryDate) <= new Date()) {
        setError('Expired food or medicine items are strictly prohibited.');
        return;
      }
    }

    onSubmit(form);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-4xl">
      <h2 className="text-lg font-bold text-[#0A192F] mb-1">Create & Publish a Donation Post</h2>
      <p className="text-xs text-slate-500 mb-6">
        Enter item details and pickup schedule to alert approved volunteers in your area.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-300 text-xs text-red-700 font-bold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Donation Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. High School Textbooks (Set of 40)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              {DONATION_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Item Name *</label>
            <input
              type="text"
              required
              value={form.itemName}
              onChange={e => setForm({ ...form, itemName: e.target.value })}
              placeholder="e.g. Science Textbooks"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Unit *</label>
            <input
              type="text"
              required
              value={form.unit}
              onChange={e => setForm({ ...form, unit: e.target.value })}
              placeholder="Books, Kg, Boxes, Packs"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0A192F] mb-1">Detailed Description *</label>
          <textarea
            rows={3}
            required
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Describe item condition and packaging..."
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Condition</label>
            <select
              value={form.condition}
              onChange={e => setForm({ ...form, condition: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option>New / Unused</option>
              <option>Freshly Prepared / Sealed</option>
              <option>Gently Used — Good Condition</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={e => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">
              Expiry Date {isPerishable ? '(Required *)' : '(Optional)'}
            </label>
            <input
              type="date"
              required={isPerishable}
              value={form.expiryDate}
              onChange={e => setForm({ ...form, expiryDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">City / Area *</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Pickup Address *</label>
            <input
              type="text"
              required
              value={form.pickupAddress}
              onChange={e => setForm({ ...form, pickupAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Pickup Date & Time *</label>
            <input
              type="datetime-local"
              required
              value={form.pickupDateTime}
              onChange={e => setForm({ ...form, pickupDateTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0A192F] mb-1">Upload Item Photos</label>
          <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50 text-xs font-bold text-[#0A192F]">
            <Camera className="w-4 h-4" />
            <span>Click to upload photos</span>
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} className="hidden" />
          </label>
          {form.photos.length > 0 && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {form.photos.map((src, idx) => (
                <div key={idx} className="relative w-20 h-20">
                  <img src={src} alt="preview" className="w-20 h-20 object-cover rounded-lg border" />
                  <button
                    type="button"
                    onClick={() =>
                      setForm(prev => ({
                        ...prev,
                        photos: prev.photos.filter((_, i) => i !== idx)
                      }))
                    }
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-600 text-white text-xs flex items-center justify-center font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-[#0A192F] hover:bg-[#112240] text-white font-bold rounded-lg text-sm transition"
        >
          Publish Donation Post
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// 5. VOLUNTEER PORTAL — SUMMARY CARDS ONLY ON MAIN DASHBOARD PAGE
// ============================================================================
function VolunteerPortal({
  user,
  activeTab,
  setActiveTab,
  donations,
  requests,
  timeline,
  onAcceptDonation,
  onUpdateStatus,
  onOpenProofModal,
  onOpenIssueModal,
  onInspect
}) {
  const availableDonations = donations.filter(d => d.status === 'Awaiting Volunteer');
  const myTasks = donations.filter(d => d.volunteerId === user.id);

  const stats = {
    available: availableDonations.length,
    assigned: myTasks.filter(d => d.status === 'Volunteer Assigned').length,
    scheduled: myTasks.filter(d => d.status === 'Pickup Scheduled').length,
    inProgress: myTasks.filter(d => ['Arrived at Pickup Location', 'Collected', 'At Collection Centre', 'Ready for Delivery'].includes(d.status)).length,
    inTransit: myTasks.filter(d => d.status === 'In Transit').length,
    completed: myTasks.filter(d => d.status === 'Completed').length
  };

  const myTimeline = timeline.filter(
    e => e.actorId === user.id || myTasks.some(t => t.id === e.donationId)
  );

  // 1. MAIN DASHBOARD PAGE ONLY (Shows the 6 summary cards + quick shortcuts)
  if (activeTab === 'Dashboard') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <SummaryCard label="Available Donations" value={stats.available} icon={Package} />
          <SummaryCard label="Assigned Tasks" value={stats.assigned} icon={ClipboardList} />
          <SummaryCard label="Pickups Scheduled" value={stats.scheduled} icon={Calendar} />
          <SummaryCard label="Tasks In Progress" value={stats.inProgress} icon={Activity} />
          <SummaryCard label="Deliveries In Transit" value={stats.inTransit} icon={Truck} />
          <SummaryCard label="Completed Tasks" value={stats.completed} icon={CheckCircle2} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0A192F]">Volunteer Logistics Overview</h2>
            <p className="text-xs text-slate-500">
              Accept available donations in your city or update status milestones on your assigned tasks.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('Available Donations')}
              className="px-4 py-2.5 rounded-lg bg-[#0A192F] text-white text-xs font-bold"
            >
              Browse Available Donations ({stats.available})
            </button>
            <button
              onClick={() => setActiveTab('My Assigned Tasks')}
              className="px-4 py-2.5 rounded-lg border border-[#0A192F] text-[#0A192F] text-xs font-bold"
            >
              My Assigned Tasks ({myTasks.length})
            </button>
          </div>
        </div>

        <SharedTimelineEngine
          title="Recent Volunteer Timeline"
          subtitle="Your latest pickup and delivery milestones."
          events={myTimeline.slice(0, 5)}
        />
      </div>
    );
  }

  if (activeTab === 'My Timeline') {
    return (
      <SharedTimelineEngine
        title="Volunteer Activity Timeline"
        subtitle="Chronological history of your accepted assignments and status updates."
        events={myTimeline}
      />
    );
  }

  if (activeTab === 'Available Donations') {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div>
          <h2 className="text-lg font-bold text-[#0A192F]">Available Donations for Pickup</h2>
          <p className="text-xs text-slate-500">
            Eligible donation posts from approved donors awaiting volunteer pickup.
          </p>
        </div>

        {availableDonations.length === 0 ? (
          <EmptyState
            title="0 Available Donations for Pickup"
            description="No donations are currently waiting for a volunteer. When a donor publishes a post, it will appear here."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableDonations.map(d => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4 items-start">
                  {d.photos && d.photos[0] ? (
                    <img
                      src={d.photos[0]}
                      alt={d.title}
                      className="w-24 h-24 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                      <Package className="w-8 h-8 text-[#0A192F]" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-[#0A192F]">
                        {d.id} • {d.priority}
                      </span>
                      <StatusBadge status={d.status} />
                    </div>
                    <h3 className="font-bold text-[#0A192F] text-base leading-snug">{d.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{d.description}</p>
                    <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                      <div>Qty: <strong className="text-[#0A192F]">{d.quantity} {d.unit}</strong> • Area: <strong className="text-[#0A192F]">{d.city}</strong></div>
                      <div>Pickup: <strong className="text-[#0A192F]">{d.pickupDateTime?.replace('T', ' ')}</strong></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => onInspect(d)}
                    className="text-xs font-bold text-[#0A192F] hover:underline px-2 py-1"
                  >
                    Inspect Details
                  </button>
                  <button
                    onClick={() => onAcceptDonation(d.id)}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Truck className="w-4 h-4" />
                    Accept Donation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (activeTab === 'Available Requests') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0A192F]">Available Receiver Requests</h2>
        {requests.length === 0 ? (
          <EmptyState title="0 Receiver Requests" description="No receiver requests have been submitted yet." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requests.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs font-bold text-[#0A192F]">{r.id}</span>
                  <StatusBadge status={r.status} />
                </div>
                <div className="font-bold text-[#0A192F]">{r.title}</div>
                <p className="text-xs text-slate-600">{r.description}</p>
                <div className="text-xs text-slate-500">City: {r.city} • Qty: {r.quantity}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Assigned Tasks / Pickup Schedule / Delivery Tracking / Completed Tasks
  const displayedTasks =
    activeTab === 'Completed Tasks' || activeTab === 'My Impact'
      ? myTasks.filter(t => t.status === 'Completed')
      : myTasks;

  return (
    <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0A192F]">{activeTab}</h2>
        <p className="text-xs text-slate-500">
          Update task milestones in real time. Final completion requires delivery proof upload and receiver confirmation.
        </p>
      </div>

      {displayedTasks.length === 0 ? (
        <EmptyState
          title="0 Tasks in This View"
          description="You do not have any tasks matching this section yet."
        />
      ) : (
        <div className="space-y-4">
          {displayedTasks.map(task => {
            const currentIdx = VOLUNTEER_STATUS_FLOW.indexOf(task.status);
            const nextStatus =
              currentIdx >= 0 && currentIdx < VOLUNTEER_STATUS_FLOW.length - 1
                ? VOLUNTEER_STATUS_FLOW[currentIdx + 1]
                : null;

            return (
              <div
                key={task.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0A192F]">{task.id}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <h3 className="text-base font-bold text-[#0A192F]">{task.title}</h3>
                  <div className="text-xs text-slate-600 flex flex-wrap gap-4">
                    <span>Donor: <strong>{task.donorName}</strong> ({task.donorPhone})</span>
                    <span>Pickup: <strong>{task.pickupAddress}, {task.city}</strong></span>
                    <span>Receiver: <strong>{task.receiverName || 'Awaiting Match'}</strong></span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => onInspect(task)}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-bold text-[#0A192F]"
                  >
                    Timeline & Details
                  </button>

                  {nextStatus && nextStatus !== 'Delivered' && task.status !== 'Completed' && (
                    <button
                      onClick={() => onUpdateStatus(task.id, nextStatus)}
                      className="px-4 py-2 rounded-lg bg-[#0A192F] hover:bg-[#112240] text-white text-xs font-bold"
                    >
                      Mark "{nextStatus}"
                    </button>
                  )}

                  {nextStatus === 'Delivered' && task.status !== 'Completed' && (
                    <button
                      onClick={() => onOpenProofModal(task)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload Proof & Deliver
                    </button>
                  )}

                  {task.status !== 'Completed' && (
                    <button
                      onClick={() => onOpenIssueModal(task)}
                      className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      Report Issue
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ============================================================================
// 6. RECEIVER PORTAL — SUMMARY CARDS ONLY ON MAIN DASHBOARD PAGE
// ============================================================================
function ReceiverPortal({
  user,
  activeTab,
  setActiveTab,
  donations,
  requests,
  timeline,
  onCreateRequest,
  onClaimDonation,
  onOpenReceiptModal,
  onInspect
}) {
  const myRequests = requests.filter(r => r.receiverId === user.id);
  const myDonations = donations.filter(d => d.receiverId === user.id);
  const browseableDonations = donations.filter(
    d => !d.receiverId && !['Completed', 'Cancelled'].includes(d.status)
  );

  const stats = {
    totalRequests: myRequests.length,
    pendingRequests: myRequests.filter(r => r.status === 'Pending Review').length,
    approvedRequests: myRequests.filter(r => r.status === 'Approved').length,
    volunteerAssigned: myDonations.filter(d => d.volunteerId && d.status !== 'Completed').length,
    inProgress: myDonations.filter(d => ['Collected', 'In Transit', 'Delivered'].includes(d.status)).length,
    received: myDonations.filter(d => d.status === 'Completed').length
  };

  const myTimeline = timeline.filter(
    e =>
      e.actorId === user.id ||
      myRequests.some(r => r.id === e.requestId) ||
      myDonations.some(d => d.id === e.donationId)
  );

  // 1. MAIN DASHBOARD PAGE ONLY (Shows 6 summary cards + quick actions)
  if (activeTab === 'Dashboard') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <SummaryCard label="Total Requests" value={stats.totalRequests} icon={FileText} />
          <SummaryCard label="Pending Requests" value={stats.pendingRequests} icon={Clock} />
          <SummaryCard label="Approved Requests" value={stats.approvedRequests} icon={CheckCircle2} />
          <SummaryCard label="Volunteer Assigned" value={stats.volunteerAssigned} icon={Users} />
          <SummaryCard label="Deliveries In Progress" value={stats.inProgress} icon={Truck} />
          <SummaryCard label="Received Donations" value={stats.received} icon={Heart} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0A192F]">Receiver Portal Overview</h2>
            <p className="text-xs text-slate-500">
              Request essential items, track matched deliveries, and confirm receipt upon arrival.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setActiveTab('Request Donation')}
              className="px-4 py-2.5 rounded-lg bg-[#0A192F] text-white text-xs font-bold"
            >
              + Request Donation
            </button>
            <button
              onClick={() => setActiveTab('Browse Available Donations')}
              className="px-4 py-2.5 rounded-lg border border-[#0A192F] text-[#0A192F] text-xs font-bold"
            >
              Browse Available Donations
            </button>
          </div>
        </div>

        <SharedTimelineEngine
          title="Recent Request & Delivery Timeline"
          subtitle="Latest updates on your requests and matched deliveries."
          events={myTimeline.slice(0, 5)}
        />
      </div>
    );
  }

  if (activeTab === 'Request Donation') {
    return <CreateRequestForm user={user} onSubmit={onCreateRequest} />;
  }

  if (activeTab === 'Request Timeline') {
    return (
      <SharedTimelineEngine
        title="Complete Request & Delivery Timeline"
        subtitle="Chronological history of your requests and deliveries."
        events={myTimeline}
      />
    );
  }

  if (activeTab === 'Browse Available Donations') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0A192F]">Browse Available Donations</h2>
        {browseableDonations.length === 0 ? (
          <EmptyState
            title="0 Unassigned Donations Available"
            description="Submit a custom Donation Request so donors and administrators can match items to you."
            actionLabel="Submit Donation Request"
            onAction={() => setActiveTab('Request Donation')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {browseableDonations.map(d => (
              <div key={d.id} className="p-5 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-[#0A192F]">{d.id}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <h3 className="font-bold text-[#0A192F]">{d.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{d.description}</p>
                  <div className="text-xs text-slate-500 mt-2">
                    Qty: <strong>{d.quantity} {d.unit}</strong> • Area: <strong>{d.city}</strong>
                  </div>
                </div>
                <button
                  onClick={() => onClaimDonation(d.id)}
                  className="w-full py-2.5 bg-[#0A192F] hover:bg-[#112240] text-white rounded-lg text-xs font-bold"
                >
                  Request This Donation
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (activeTab === 'My Requests') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0A192F]">My Submitted Donation Requests</h2>
        {myRequests.length === 0 ? (
          <EmptyState title="0 Requests Submitted" description="You have not submitted any requests yet." />
        ) : (
          <div className="space-y-3">
            {myRequests.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-[#0A192F]">{r.id} • {r.category}</div>
                  <div className="font-bold text-[#0A192F]">{r.title}</div>
                  <div className="text-xs text-slate-500">Qty: {r.quantity} • Beneficiaries: {r.beneficiaries}</div>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Assigned Donations / Delivery Tracking / Received Donations
  const filtered =
    activeTab === 'Received Donations'
      ? myDonations.filter(d => d.status === 'Completed')
      : myDonations;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h2 className="text-base font-bold text-[#0A192F]">{activeTab}</h2>
      {filtered.length === 0 ? (
        <EmptyState
          title="0 Records Found"
          description="Donations matched or delivered to your account will appear here."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0A192F]">{d.id}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="font-bold text-[#0A192F]">{d.title}</div>
                <div className="text-xs text-slate-500">
                  Volunteer: {d.volunteerName || 'Awaiting Volunteer'} • Qty: {d.quantity} {d.unit}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onInspect(d)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-[#0A192F]"
                >
                  View Timeline
                </button>
                {d.status === 'Delivered' && (
                  <button
                    onClick={() => onOpenReceiptModal(d)}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Confirm Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateRequestForm({ user, onSubmit }) {
  const [form, setForm] = useState({
    title: '',
    category: DONATION_CATEGORIES[0],
    description: '',
    quantity: 10,
    reason: '',
    beneficiaries: 10,
    urgency: 'High',
    deliveryAddress: user.address || '',
    city: user.city || '',
    preferredDate: ''
  });

  return (
    <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
      <h2 className="text-lg font-bold text-[#0A192F] mb-1">Submit a Donation Request</h2>
      <p className="text-xs text-slate-500 mb-6">
        Requests are reviewed by Administrators and matched with eligible donations.
      </p>
      <form
        onSubmit={e => {
          e.preventDefault();
          onSubmit(form);
        }}
        className="space-y-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Request Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Grocery Kits for 20 Families"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Category *</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              {DONATION_CATEGORIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[#0A192F] mb-1">Description & Reason *</label>
          <textarea
            rows={3}
            required
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value, reason: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Quantity *</label>
            <input
              type="number"
              min="1"
              required
              value={form.quantity}
              onChange={e => setForm({ ...form, quantity: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Beneficiaries</label>
            <input
              type="number"
              min="1"
              value={form.beneficiaries}
              onChange={e => setForm({ ...form, beneficiaries: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Urgency</label>
            <select
              value={form.urgency}
              onChange={e => setForm({ ...form, urgency: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            >
              <option>Standard</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">City *</label>
            <input
              type="text"
              required
              value={form.city}
              onChange={e => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Delivery Address *</label>
            <input
              type="text"
              required
              value={form.deliveryAddress}
              onChange={e => setForm({ ...form, deliveryAddress: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#0A192F] mb-1">Preferred Date *</label>
            <input
              type="date"
              required
              value={form.preferredDate}
              onChange={e => setForm({ ...form, preferredDate: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-[#0A192F] hover:bg-[#112240] text-white rounded-lg text-sm font-bold"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
}

// ============================================================================
// 7. ADMIN PORTAL — SUMMARY CARDS ONLY ON MAIN DASHBOARD PAGE
// ============================================================================
function AdminPortal({
  users,
  activeTab,
  setActiveTab,
  donations,
  requests,
  timeline,
  complaints,
  onUpdateUserStatus,
  onDecisionRequest,
  onMatchDonation,
  onCancelDonation,
  onResolveComplaint,
  onInspect
}) {
  const nonAdminUsers = users.filter(u => u.role !== 'admin');
  const pendingUsers = nonAdminUsers.filter(u => u.status === 'Pending Approval');
  const [roleFilter, setRoleFilter] = useState('all');

  const stats = {
    totalUsers: nonAdminUsers.length,
    pendingApprovals: pendingUsers.length,
    approvedDonors: nonAdminUsers.filter(u => u.role === 'donor' && u.status === 'Approved').length,
    approvedVolunteers: nonAdminUsers.filter(u => u.role === 'volunteer' && u.status === 'Approved').length,
    verifiedReceivers: nonAdminUsers.filter(u => u.role === 'receiver' && u.status === 'Approved').length,
    totalDonations: donations.length,
    pendingDonations: donations.filter(d => d.status === 'Awaiting Volunteer').length,
    activeAssignments: donations.filter(d => d.volunteerId && d.status !== 'Completed').length,
    completedDonations: donations.filter(d => d.status === 'Completed').length,
    openComplaints: complaints.filter(c => c.status === 'Open').length
  };

  // 1. MAIN DASHBOARD PAGE ONLY (Shows summary cards + quick overview)
  if (activeTab === 'Dashboard') {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <SummaryCard label="Registered Users" value={stats.totalUsers} icon={Users} />
          <SummaryCard label="Pending Approvals" value={stats.pendingApprovals} icon={Clock} />
          <SummaryCard label="Approved Donors" value={stats.approvedDonors} icon={Heart} />
          <SummaryCard label="Approved Volunteers" value={stats.approvedVolunteers} icon={Truck} />
          <SummaryCard label="Verified Receivers" value={stats.verifiedReceivers} icon={ShieldCheck} />
          <SummaryCard label="Total Donations" value={stats.totalDonations} icon={Package} />
          <SummaryCard label="Awaiting Volunteer" value={stats.pendingDonations} icon={Clock} />
          <SummaryCard label="Active Assignments" value={stats.activeAssignments} icon={Activity} />
          <SummaryCard label="Completed Donations" value={stats.completedDonations} icon={CheckCircle2} />
          <SummaryCard label="Open Complaints" value={stats.openComplaints} icon={AlertOctagon} />
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#0A192F]">Administrator Control Center</h2>
            <p className="text-xs text-slate-500">
              Review pending user registrations, manage donations, match receiver requests, and audit global activity.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setActiveTab('Pending Approvals')}
              className="px-4 py-2.5 rounded-lg bg-[#0A192F] text-white text-xs font-bold"
            >
              Review Pending Approvals ({stats.pendingApprovals})
            </button>
            <button
              onClick={() => setActiveTab('Global Timeline')}
              className="px-4 py-2.5 rounded-lg border border-[#0A192F] text-[#0A192F] text-xs font-bold"
            >
              Open Global Timeline
            </button>
          </div>
        </div>

        <SharedTimelineEngine
          title="Latest Platform Activity"
          subtitle="Real-time audit log across all roles."
          events={timeline.slice(0, 6)}
        />
      </div>
    );
  }

  // 2. PENDING APPROVALS / USER MANAGEMENT PAGES
  if (activeTab === 'Pending Approvals' || activeTab === 'User Management') {
    const baseList = activeTab === 'Pending Approvals' ? pendingUsers : nonAdminUsers;
    const filteredUsers = baseList.filter(u => roleFilter === 'all' || u.role === roleFilter);

    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#0A192F]">{activeTab}</h2>
            <p className="text-xs text-slate-500">
              Approve (Green) or Reject/Suspend (Red) Donor, Volunteer, and Receiver accounts.
            </p>
          </div>
          <div className="flex gap-2">
            {['all', 'donor', 'volunteer', 'receiver'].map(r => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase ${
                  roleFilter === r ? 'bg-[#0A192F] text-white' : 'bg-slate-100 text-[#0A192F]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="0 User Accounts in This View"
            description="When users register on the sign-up page, their accounts will appear here for verification."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase">
                  <th className="py-3 px-3">User ID</th>
                  <th className="py-3 px-3">Name & Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">City & Phone</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-3 font-bold text-[#0A192F]">{u.id}</td>
                    <td className="py-3.5 px-3">
                      <div className="font-bold text-[#0A192F]">{u.fullName}</div>
                      <div className="text-slate-500">{u.email}</div>
                    </td>
                    <td className="py-3.5 px-3 uppercase font-bold text-[#0A192F]">{u.role}</td>
                    <td className="py-3.5 px-3">{u.city} • {u.phone}</td>
                    <td className="py-3.5 px-3"><StatusBadge status={u.status} /></td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      {u.status !== 'Approved' && (
                        <button
                          onClick={() => onUpdateUserStatus(u.id, 'Approved')}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                        >
                          Accept / Approve
                        </button>
                      )}
                      {u.status === 'Pending Approval' && (
                        <button
                          onClick={() => onUpdateUserStatus(u.id, 'Rejected', 'Rejected by Administrator')}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          Reject
                        </button>
                      )}
                      {u.status === 'Approved' && (
                        <button
                          onClick={() => onUpdateUserStatus(u.id, 'Suspended', 'Suspended by Administrator')}
                          className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold"
                        >
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // 3. DONATION MANAGEMENT / VOLUNTEER ASSIGNMENTS
  if (activeTab === 'Donation Management' || activeTab === 'Volunteer Assignments') {
    const approvedReceivers = nonAdminUsers.filter(
      u => u.role === 'receiver' && u.status === 'Approved'
    );
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0A192F]">{activeTab}</h2>
        {donations.length === 0 ? (
          <EmptyState title="0 Donations Published" description="No donations have been posted yet." />
        ) : (
          <div className="space-y-3">
            {donations.map(d => (
              <div key={d.id} className="p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0A192F]">{d.id}</span>
                    <StatusBadge status={d.status} />
                  </div>
                  <div className="font-bold text-[#0A192F]">{d.title} ({d.quantity} {d.unit})</div>
                  <div className="text-xs text-slate-500">
                    Donor: {d.donorName} • Volunteer: {d.volunteerName || 'Unassigned'} • Receiver: {d.receiverName || 'Unassigned'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!d.receiverId && approvedReceivers.length > 0 && (
                    <select
                      defaultValue=""
                      onChange={e => e.target.value && onMatchDonation(d.id, e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                    >
                      <option value="" disabled>Assign Receiver...</option>
                      {approvedReceivers.map(rec => (
                        <option key={rec.id} value={rec.id}>{rec.fullName} ({rec.city})</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={() => onInspect(d)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-[#0A192F]"
                  >
                    Timeline
                  </button>
                  {d.status !== 'Cancelled' && d.status !== 'Completed' && (
                    <button
                      onClick={() => onCancelDonation(d.id)}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. DONATION REQUESTS
  if (activeTab === 'Donation Requests') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0A192F]">Receiver Donation Requests</h2>
        {requests.length === 0 ? (
          <EmptyState title="0 Receiver Requests" description="Requests submitted by receivers will appear here." />
        ) : (
          <div className="space-y-3">
            {requests.map(r => (
              <div key={r.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#0A192F]">{r.id}</span>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="font-bold text-[#0A192F]">{r.title}</div>
                  <div className="text-xs text-slate-500">Receiver: {r.receiverName} • Qty: {r.quantity} • City: {r.city}</div>
                </div>
                {r.status === 'Pending Review' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDecisionRequest(r.id, 'Approved')}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => onDecisionRequest(r.id, 'Rejected')}
                      className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 5. COMPLAINTS & DISPUTES
  if (activeTab === 'Complaints & Disputes') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h2 className="text-base font-bold text-[#0A192F]">Complaints & Support Tickets</h2>
        {complaints.length === 0 ? (
          <EmptyState title="0 Open Complaints" description="No complaints or disputes have been reported." />
        ) : (
          <div className="space-y-3">
            {complaints.map(c => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-red-600">{c.id} • Target: {c.donationId}</div>
                  <div className="font-bold text-[#0A192F]">{c.reason}</div>
                  <div className="text-xs text-slate-500">Reported by {c.reporterName} ({c.reporterRole})</div>
                </div>
                {c.status === 'Open' ? (
                  <button
                    onClick={() => onResolveComplaint(c.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <StatusBadge status={c.status} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 6. GLOBAL TIMELINE
  return (
    <SharedTimelineEngine
      title="Global Platform Activity & Audit Timeline"
      subtitle="Complete chronological ledger of all registrations, approvals, donations, tasks, and confirmations."
      events={timeline}
    />
  );
}

// ============================================================================
// 8. SHARED DONATION TIMELINE ENGINE (NAVY BLUE & WHITE)
// ============================================================================
function SharedTimelineEngine({ title, subtitle, events }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[#0A192F]">{title}</h2>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      {events.length === 0 ? (
        <EmptyState
          title="0 Timeline Events Recorded Yet"
          description="Every registration, donation post, volunteer pickup, status transition, and receiver confirmation will appear here automatically."
        />
      ) : (
        <div className="relative pl-6 border-l-2 border-[#0A192F] space-y-5">
          {events.map((ev, index) => (
            <div key={ev.id} className="relative bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div
                className={`absolute -left-[31px] top-4 w-4 h-4 rounded-full border-2 border-white ${
                  index === 0 ? 'bg-[#0A192F] ring-4 ring-slate-200' : 'bg-slate-400'
                }`}
              />
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#0A192F]">{ev.eventType}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0A192F] text-white">
                      LATEST
                    </span>
                  )}
                  {ev.newStatus && <StatusBadge status={ev.newStatus} />}
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {new Date(ev.timestamp).toLocaleString()}
                </span>
              </div>

              <p className="text-xs text-slate-700">{ev.description}</p>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-[11px] text-slate-500">
                <span>Event ID: <strong className="text-[#0A192F]">{ev.id}</strong></span>
                {ev.donationId && <span>Donation: <strong className="text-[#0A192F]">{ev.donationId}</strong></span>}
                {ev.requestId && <span>Request: <strong className="text-[#0A192F]">{ev.requestId}</strong></span>}
                <span>Actor: <strong className="text-[#0A192F]">{ev.actorName} ({ev.actorRole})</strong></span>
                {ev.location && <span>Location: <strong className="text-[#0A192F]">{ev.location}</strong></span>}
              </div>

              {ev.proofUrl && (
                <div className="mt-3">
                  <img
                    src={ev.proofUrl}
                    alt="Delivery Proof"
                    className="w-32 h-24 object-cover rounded-lg border border-slate-300"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROFILE, NOTIFICATIONS, HELP & MODALS
// ============================================================================
function ProfileView({ user, onUpdateProfile }) {
  const [form, setForm] = useState({
    fullName: user.fullName || '',
    phone: user.phone || '',
    city: user.city || '',
    address: user.address || ''
  });

  return (
    <div className="max-w-2xl bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
      <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
        <div className="w-16 h-16 rounded-2xl bg-[#0A192F] text-white flex items-center justify-center font-bold text-xl uppercase">
          {user.fullName.slice(0, 2)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0A192F]">{user.fullName}</h2>
          <p className="text-xs text-slate-500">{user.email} • {user.role.toUpperCase()} • {user.id}</p>
          <div className="mt-2"><StatusBadge status={user.status} /></div>
        </div>
      </div>

      <form
        onSubmit={e => {
          e.preventDefault();
          onUpdateProfile(form);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-xs font-bold text-[#0A192F] mb-1">Full Name</label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={e => setForm({ ...form, fullName: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#0A192F] mb-1">Phone Number</label>
          <input
            type="text"
            required
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#0A192F] mb-1">City / Area</label>
          <input
            type="text"
            required
            value={form.city}
            onChange={e => setForm({ ...form, city: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#0A192F] mb-1">Address</label>
          <input
            type="text"
            required
            value={form.address}
            onChange={e => setForm({ ...form, address: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-2.5 bg-[#0A192F] hover:bg-[#112240] text-white rounded-lg text-xs font-bold"
        >
          Save Profile Changes
        </button>
      </form>
    </div>
  );
}

function NotificationsView({ notifications, onMarkRead, onMarkAllRead, onNavigate }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#0A192F]">Notifications</h2>
          <p className="text-xs text-slate-500">Real-time alerts for your account and donations.</p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={onMarkAllRead}
            className="px-3.5 py-1.5 rounded-lg border border-[#0A192F] text-xs font-bold text-[#0A192F]"
          >
            Mark All as Read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState title="0 Notifications" description="You have no notifications yet." />
      ) : (
        <div className="space-y-2.5">
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => {
                onMarkRead(n.id);
                if (n.targetTab) onNavigate(n.targetTab);
              }}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                n.read ? 'bg-white border-slate-200' : 'bg-slate-50 border-[#0A192F]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0A192F]">{n.title}</span>
                <span className="text-[11px] text-slate-400">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1">{n.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HelpSupportView({ onSubmitTicket }) {
  const [message, setMessage] = useState('');
  return (
    <div className="max-w-xl bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <h2 className="text-base font-bold text-[#0A192F]">Help & Support</h2>
      <p className="text-xs text-slate-500">Submit a support request directly to the Platform Administrators.</p>
      <textarea
        rows={4}
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Describe your issue..."
        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm"
      />
      <button
        onClick={() => {
          if (!message.trim()) return;
          onSubmitTicket(message.trim());
          setMessage('');
        }}
        className="px-5 py-2.5 bg-[#0A192F] text-white rounded-lg text-xs font-bold"
      >
        Submit Support Ticket
      </button>
    </div>
  );
}

function InspectModal({ item, timeline, onClose }) {
  const itemEvents = timeline.filter(e => e.donationId === item.id || e.requestId === item.id);
  return (
    <div className="fixed inset-0 bg-[#0A192F]/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <span className="text-xs font-bold text-[#0A192F]">{item.id}</span>
            <h3 className="text-lg font-bold text-[#0A192F]">{item.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0A192F] font-bold text-lg">✕</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>Status: <StatusBadge status={item.status} /></div>
          <div>Category: <strong>{item.category}</strong></div>
          <div>Quantity: <strong>{item.quantity} {item.unit || ''}</strong></div>
          <div>City: <strong>{item.city}</strong></div>
          <div>Donor: <strong>{item.donorName || 'N/A'}</strong></div>
          <div>Volunteer: <strong>{item.volunteerName || 'Unassigned'}</strong></div>
        </div>

        <SharedTimelineEngine
          title="Donation Timeline History"
          subtitle={`Complete chronological log for ${item.id}`}
          events={itemEvents}
        />
      </div>
    </div>
  );
}

function ProofUploadModal({ donation, onClose, onSubmit }) {
  const [photoUrl, setPhotoUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleFile = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setPhotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-[#0A192F]/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-[#0A192F]">Upload Delivery Proof ({donation.id})</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-[#0A192F]">✕</button>
        </div>
        <input type="file" accept="image/*" onChange={handleFile} className="text-xs" />
        {photoUrl && <img src={photoUrl} alt="Proof" className="w-full h-36 object-cover rounded-lg border" />}
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Delivery handover notes..."
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-xs font-bold">Cancel</button>
          <button
            onClick={() => onSubmit(photoUrl, notes)}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold"
          >
            Submit Proof & Mark Delivered
          </button>
        </div>
      </div>
    </div>
  );
}

function IssueReportModal({ donation, onClose, onSubmit }) {
  const [reason, setReason] = useState('Donor unavailable');
  return (
    <div className="fixed inset-0 bg-[#0A192F]/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-bold text-[#0A192F]">Report Issue ({donation.id})</h3>
        <select
          value={reason}
          onChange={e => setReason(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
        >
          <option>Donor unavailable</option>
          <option>Pickup address issue</option>
          <option>Donation quantity mismatch</option>
          <option>Unsafe or damaged items</option>
          <option>Receiver unavailable</option>
          <option>Delivery delayed</option>
        </select>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-xs font-bold">Cancel</button>
          <button
            onClick={() => onSubmit(reason)}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold"
          >
            Submit Issue
          </button>
        </div>
      </div>
    </div>
  );
}

function ReceiverConfirmModal({ donation, onClose, onConfirm }) {
  const [notes, setNotes] = useState('');
  const [hasIssue, setHasIssue] = useState(false);
  return (
    <div className="fixed inset-0 bg-[#0A192F]/70 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
        <h3 className="font-bold text-[#0A192F]">Confirm Donation Receipt ({donation.id})</h3>
        <label className="flex items-center gap-2 text-xs text-red-600 font-bold">
          <input type="checkbox" checked={hasIssue} onChange={e => setHasIssue(e.target.checked)} />
          Report missing or damaged items instead
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={hasIssue ? 'Describe the issue...' : 'Confirmation note for the donor...'}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border text-xs font-bold">Cancel</button>
          <button
            onClick={() => onConfirm(notes, hasIssue)}
            className={`px-4 py-2 rounded-lg text-white text-xs font-bold ${
              hasIssue ? 'bg-red-600' : 'bg-emerald-600'
            }`}
          >
            {hasIssue ? 'Report Issue' : 'Accept & Confirm Receipt'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SUMMARY CARD, EMPTY STATE & TOAST (NAVY BLUE & WHITE)
// ============================================================================
function SummaryCard({ label, value, icon: Icon }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
      <div>
        <div className="text-xs font-bold text-slate-500">{label}</div>
        <div className="text-2xl font-extrabold text-[#0A192F] mt-1">{value}</div>
      </div>
      <div className="w-11 h-11 rounded-xl bg-[#0A192F] text-white flex items-center justify-center shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

function EmptyState({ title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 space-y-2">
      <div className="w-11 h-11 rounded-full bg-[#0A192F] text-white flex items-center justify-center mx-auto">
        <Package className="w-5 h-5" />
      </div>
      <div className="text-sm font-bold text-[#0A192F]">{title}</div>
      <p className="text-xs text-slate-500 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-4 py-2 bg-[#0A192F] text-white rounded-lg text-xs font-bold hover:bg-[#112240]"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function ToastBanner({ toast }) {
  return (
    <div
      className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg text-white flex items-center gap-3 text-xs font-bold ${
        toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'
      }`}
    >
      <span>{toast.message}</span>
    </div>
  );
}