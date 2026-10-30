import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Room, Reservation, FolioData, OperationalMetrics, RoomType, User } from '../types/hotel.ts';
import { 
  Plus, RefreshCw, Search, FileText, X, Users, UserCheck,
  ChevronDown, ChevronUp, Calendar, CreditCard, Eye, BedDouble,
  Trash2, Edit, Upload, Image as ImageIcon, DoorOpen, Check
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { user, token } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'frontdesk' | 'matrix' | 'suites' | 'reservations' | 'reports' | 'users'>('frontdesk');
  
  // Data states
  const [metrics, setMetrics] = useState<OperationalMetrics | null>(null);
  const [arrivals, setArrivals] = useState<Reservation[]>([]);
  const [departures, setDepartures] = useState<Reservation[]>([]);
  const [inHouseGuests, setInHouseGuests] = useState<Reservation[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Search & Filter states
  const [resSearch, setResSearch] = useState<string>('');
  const [resStatusFilter, setResStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');

  // Guest Directory search & filters
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [expandedUserId, setExpandedUserId] = useState<number | null>(null);

  // Modals state
  const [selectedFolioId, setSelectedFolioId] = useState<string | null>(null);
  const [currentFolioData, setCurrentFolioData] = useState<FolioData | null>(null);
  
  // Charge Modal state
  const [chargeModalResId, setChargeModalResId] = useState<string | null>(null);
  const [chargeDesc, setChargeDesc] = useState<string>('Le Belvédère - In-Suite Dining');
  const [chargeCategory, setChargeCategory] = useState<string>('dining');
  const [chargeAmount, setChargeAmount] = useState<string>('85.00');

  // New Walk-in Reservation Modal
  const [walkinModalOpen, setWalkinModalOpen] = useState<boolean>(false);
  const [walkinGuestName, setWalkinGuestName] = useState<string>('');
  const [walkinEmail, setWalkinEmail] = useState<string>('');
  const [walkinPhone, setWalkinPhone] = useState<string>('');
  const [walkinRoomType, setWalkinRoomType] = useState<string>('deluxe-ocean');
  const [walkinCheckIn, setWalkinCheckIn] = useState<string>(new Date().toISOString().split('T')[0]);
  const [walkinCheckOut, setWalkinCheckOut] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() + 2); return d.toISOString().split('T')[0];
  });
  const [walkinGuests, setWalkinGuests] = useState<number>(2);

  // Room Assignment Modal
  const [assignRoomModalBooking, setAssignRoomModalBooking] = useState<Reservation | null>(null);
  const [selectedAssignRoomId, setSelectedAssignRoomId] = useState<string>('');

  // ── Physical Room Add / Edit / Delete Modal State ──────────────────────────
  const [roomModalOpen, setRoomModalOpen] = useState<boolean>(false);
  const [roomModalMode, setRoomModalMode] = useState<'create' | 'edit'>('create');
  const [roomFormId, setRoomFormId] = useState<string>('');
  const [roomFormTypeId, setRoomFormTypeId] = useState<string>('');
  const [roomFormFloor, setRoomFormFloor] = useState<number>(1);
  const [roomFormStatus, setRoomFormStatus] = useState<Room['status']>('available');
  const [roomFormNotes, setRoomFormNotes] = useState<string>('');
  const [isSavingRoom, setIsSavingRoom] = useState<boolean>(false);

  // ── Room Suite Category Add / Edit / Delete Modal State ────────────────────
  const [suiteModalOpen, setSuiteModalOpen] = useState<boolean>(false);
  const [suiteModalMode, setSuiteModalMode] = useState<'create' | 'edit'>('create');
  const [suiteFormId, setSuiteFormId] = useState<string>('');
  const [suiteFormName, setSuiteFormName] = useState<string>('');
  const [suiteFormCategory, setSuiteFormCategory] = useState<string>('Luxury Suites');
  const [suiteFormDescription, setSuiteFormDescription] = useState<string>('');
  const [suiteFormPrice, setSuiteFormPrice] = useState<string>('450');
  const [suiteFormOccupancy, setSuiteFormOccupancy] = useState<number>(2);
  const [suiteFormSize, setSuiteFormSize] = useState<string>('55');
  const [suiteFormBedType, setSuiteFormBedType] = useState<string>('King Canopy Bed');
  const [suiteFormViewType, setSuiteFormViewType] = useState<string>('Oceanfront Vista');
  const [suiteFormImageUrl, setSuiteFormImageUrl] = useState<string>('');
  const [suiteFormAmenities, setSuiteFormAmenities] = useState<string>('Marble Soaking Tub, Fiber Wi-Fi, Butler Service, Nespresso Bar');
  const [isSavingSuite, setIsSavingSuite] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  const authHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };

  const loadDashboardData = async () => {
    setIsLoading(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      // 1. Operational reports
      const repRes = await fetch('/api/reports/dashboard', { headers: authHeaders });
      if (repRes.ok) {
        const repData = await repRes.json();
        setMetrics(repData.metrics);
        setArrivals(repData.arrivals || []);
        setDepartures(repData.departures || []);
        setInHouseGuests(repData.inHouseGuests || []);
        setMonthlyTrend(repData.monthlyTrend || []);
      }

      // 2. Room Matrix
      const roomRes = await fetch('/api/rooms/matrix', { headers: authHeaders });
      if (roomRes.ok) {
        const rData = await roomRes.json();
        setRooms(rData.rooms || []);
      }

      // 3. Room types
      const rtRes = await fetch('/api/rooms/types');
      if (rtRes.ok) {
        const rtData = await rtRes.json();
        setRoomTypes(rtData.roomTypes || []);
      }

      // 4. All reservations
      const allRes = await fetch(`/api/reservations?status=${resStatusFilter}&search=${encodeURIComponent(resSearch)}`, { headers: authHeaders });
      if (allRes.ok) {
        const resData = await allRes.json();
        setReservations(resData.reservations || []);
      }

      // 5. Registered Users and Profiles (Staff, Admin, Superadmin)
      const uRes = await fetch('/api/auth/users', { headers: authHeaders });
      if (uRes.ok) {
        const uData = await uRes.json();
        setAllUsers(uData.users || []);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();

    // Auto-refresh every 12 seconds so new guest registrations and bookings reflect immediately
    const interval = setInterval(() => {
      loadDashboardData();
    }, 12000);

    return () => clearInterval(interval);
  }, [resStatusFilter, token]);

  // Handle Check-in
  const handleCheckIn = async (reservationId: string, assignedRoomId?: string | null) => {
    const targetRoom = assignedRoomId;
    if (!targetRoom) {
      const booking = reservations.find(r => r.id === reservationId) || arrivals.find(r => r.id === reservationId);
      if (booking) {
        setAssignRoomModalBooking(booking);
        return;
      }
    }

    try {
      const res = await fetch(`/api/reservations/${reservationId}/check-in`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ assigned_room_id: targetRoom })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data.message);
        loadDashboardData();
      } else {
        setActionError(data.error || 'Check-in failed');
      }
    } catch (err) {
      setActionError('Network error executing check-in');
    }
  };

  // Handle Check-out
  const handleCheckOut = async (reservationId: string) => {
    try {
      const res = await fetch(`/api/reservations/${reservationId}/check-out`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data.message);
        loadDashboardData();
      } else {
        setActionError(data.error || 'Check-out failed');
      }
    } catch (err) {
      setActionError('Network error executing check-out');
    }
  };

  // Update Room Status
  const handleUpdateRoomStatus = async (roomId: string, newStatus: string, notes?: string) => {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ status: newStatus, notes })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data.message);
        loadDashboardData();
      } else {
        setActionError(data.error || 'Failed to update room');
      }
    } catch (err) {
      setActionError('Failed to change room status');
    }
  };

  // Load Folio
  const handleOpenFolio = async (reservationId: string) => {
    setSelectedFolioId(reservationId);
    try {
      const res = await fetch(`/api/folios/${reservationId}`, { headers: authHeaders });
      if (res.ok) {
        const data = await res.json();
        setCurrentFolioData(data.folio);
      }
    } catch (err) {
      console.error('Failed to load folio:', err);
    }
  };

  // Post Charge to Room Folio
  const handlePostCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chargeModalResId) return;

    try {
      const res = await fetch(`/api/folios/${chargeModalResId}/charge`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          description: chargeDesc,
          category: chargeCategory,
          amount: parseFloat(chargeAmount)
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data.message);
        setChargeModalResId(null);
        if (selectedFolioId === chargeModalResId) {
          handleOpenFolio(chargeModalResId);
        }
        loadDashboardData();
      } else {
        setActionError(data.error || 'Failed to post charge');
      }
    } catch (err) {
      setActionError('Error posting charge');
    }
  };

  // Settle Folio
  const handleSettleFolio = async (reservationId: string, paymentMethod: string = 'credit_card') => {
    try {
      const res = await fetch(`/api/folios/${reservationId}/payment`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ payment_method: paymentMethod })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(data.message);
        handleOpenFolio(reservationId);
        loadDashboardData();
      }
    } catch (err) {
      setActionError('Error settling folio');
    }
  };

  // Walk-in Reservation Submit
  const handleCreateWalkin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          guest_name: walkinGuestName,
          guest_email: walkinEmail,
          guest_phone: walkinPhone,
          room_type_id: walkinRoomType,
          check_in_date: walkinCheckIn,
          check_out_date: walkinCheckOut,
          guests_count: walkinGuests,
          special_requests: 'Front Desk Walk-in Intake',
          payment_method: 'credit_card'
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Reservation created: ${data.reservationId}`);
        setWalkinModalOpen(false);
        setWalkinGuestName('');
        setWalkinEmail('');
        loadDashboardData();
      } else {
        setActionError(data.error || 'Failed to create reservation');
      }
    } catch (err) {
      setActionError('Network error');
    }
  };

  // Assign Room Submit
  const handleAssignRoomSubmit = async () => {
    if (!assignRoomModalBooking || !selectedAssignRoomId) return;

    try {
      const res = await fetch(`/api/reservations/${assignRoomModalBooking.id}/assign-room`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ room_id: selectedAssignRoomId })
      });
      if (res.ok) {
        setActionSuccess(`Room ${selectedAssignRoomId} assigned`);
        setAssignRoomModalBooking(null);
        setSelectedAssignRoomId('');
        loadDashboardData();
      }
    } catch (err) {
      setActionError('Failed to assign room');
    }
  };

  // User Role update (Admin only)
  const handleUpdateRole = async (userId: number, newRole: string) => {
    try {
      const res = await fetch(`/api/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ role: newRole })
      });
      if (res.ok) {
        setActionSuccess(`User role updated to ${newRole}`);
        loadDashboardData();
      }
    } catch (err) {
      setActionError('Failed to update role');
    }
  };

  const getRoomBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium border border-emerald-200">Available</span>;
      case 'occupied':
        return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px] font-medium border border-blue-200">Occupied</span>;
      case 'reserved':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">Reserved</span>;
      case 'cleaning':
        return <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px] font-medium border border-purple-200">Cleaning</span>;
      case 'maintenance':
        return <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] font-medium border border-rose-200">Maintenance</span>;
      default:
        return <span>{status}</span>;
    }
  };

  // ── Handlers for Room Unit CRUD ───────────────────────────────────────────
  const handleOpenCreateRoom = () => {
    setRoomModalMode('create');
    setRoomFormId('');
    setRoomFormTypeId(roomTypes[0]?.id || 'deluxe-ocean');
    setRoomFormFloor(1);
    setRoomFormStatus('available');
    setRoomFormNotes('');
    setRoomModalOpen(true);
  };

  const handleOpenEditRoom = (r: Room) => {
    setRoomModalMode('edit');
    setRoomFormId(r.id);
    setRoomFormTypeId(r.room_type_id);
    setRoomFormFloor(r.floor);
    setRoomFormStatus(r.status);
    setRoomFormNotes(r.notes || '');
    setRoomModalOpen(true);
  };

  const handleSaveRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormId || !roomFormTypeId) return;

    setIsSavingRoom(true);
    setActionSuccess(null);
    setActionError(null);

    try {
      if (roomModalMode === 'create') {
        const res = await fetch('/api/rooms', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            id: roomFormId.trim(),
            room_type_id: roomFormTypeId,
            floor: roomFormFloor,
            notes: roomFormNotes
          })
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Room ${roomFormId} created successfully`);
          setRoomModalOpen(false);
          loadDashboardData();
        } else {
          setActionError(data.error || 'Failed to create room');
        }
      } else {
        const res = await fetch(`/api/rooms/${roomFormId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            room_type_id: roomFormTypeId,
            floor: roomFormFloor,
            status: roomFormStatus,
            notes: roomFormNotes
          })
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Room ${roomFormId} updated successfully`);
          setRoomModalOpen(false);
          loadDashboardData();
        } else {
          setActionError(data.error || 'Failed to update room');
        }
      }
    } catch (err) {
      setActionError('Network error while saving room');
    } finally {
      setIsSavingRoom(false);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete Room ${roomId}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Room ${roomId} deleted successfully`);
        loadDashboardData();
      } else {
        setActionError(data.error || 'Failed to delete room');
      }
    } catch (err) {
      setActionError('Network error while deleting room');
    }
  };

  // ── Handlers for Room Suite Type CRUD & Image Upload ──────────────────────
  const handleOpenCreateSuite = () => {
    setSuiteModalMode('create');
    setSuiteFormId('');
    setSuiteFormName('');
    setSuiteFormCategory('Luxury Suites');
    setSuiteFormDescription('');
    setSuiteFormPrice('450');
    setSuiteFormOccupancy(2);
    setSuiteFormSize('55');
    setSuiteFormBedType('Custom King Bed');
    setSuiteFormViewType('Ocean & Skyline');
    setSuiteFormImageUrl('/src/assets/images/hero_luxury_hotel_1790748121852.jpg');
    setSuiteFormAmenities('High-Speed Wi-Fi, Marble Soaking Tub, Evening Turn-Down, Nespresso Bar');
    setSuiteModalOpen(true);
  };

  const handleOpenEditSuite = (st: RoomType) => {
    setSuiteModalMode('edit');
    setSuiteFormId(st.id);
    setSuiteFormName(st.name);
    setSuiteFormCategory(st.category || 'Luxury Suites');
    setSuiteFormDescription(st.description || '');
    setSuiteFormPrice(st.base_price.toString());
    setSuiteFormOccupancy(st.max_occupancy || 2);
    setSuiteFormSize((st.size_sqm || 50).toString());
    setSuiteFormBedType(st.bed_type || 'King Bed');
    setSuiteFormViewType(st.view_type || 'Scenic Panorama');
    setSuiteFormImageUrl(st.image_url || '');
    setSuiteFormAmenities((st.amenities || []).join(', '));
    setSuiteModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    setIsUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result as string;
        const uploadRes = await fetch('/api/rooms/upload-image', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            image: base64Data,
            filename: file.name
          })
        });
        const uploadJson = await uploadRes.json();
        if (uploadRes.ok && uploadJson.imageUrl) {
          setSuiteFormImageUrl(uploadJson.imageUrl);
          setActionSuccess('Room image uploaded successfully');
        } else {
          setActionError(uploadJson.error || 'Failed to upload image');
        }
        setIsUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setActionError('Error reading image file');
      setIsUploadingImage(false);
    }
  };

  const handleSaveSuite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suiteFormName || !suiteFormPrice) return;

    setIsSavingSuite(true);
    setActionSuccess(null);
    setActionError(null);

    const payload = {
      id: suiteFormId || undefined,
      name: suiteFormName,
      category: suiteFormCategory,
      description: suiteFormDescription,
      base_price: parseFloat(suiteFormPrice) || 300,
      max_occupancy: suiteFormOccupancy,
      size_sqm: parseFloat(suiteFormSize) || 45,
      bed_type: suiteFormBedType,
      view_type: suiteFormViewType,
      image_url: suiteFormImageUrl,
      amenities: suiteFormAmenities.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (suiteModalMode === 'create') {
        const res = await fetch('/api/rooms/types', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Room suite '${suiteFormName}' created successfully`);
          setSuiteModalOpen(false);
          loadDashboardData();
        } else {
          setActionError(data.error || 'Failed to create room suite');
        }
      } else {
        const res = await fetch(`/api/rooms/types/${suiteFormId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          setActionSuccess(`Room suite '${suiteFormName}' updated successfully`);
          setSuiteModalOpen(false);
          loadDashboardData();
        } else {
          setActionError(data.error || 'Failed to update room suite');
        }
      }
    } catch (err) {
      setActionError('Network error while saving room suite');
    } finally {
      setIsSavingSuite(false);
    }
  };

  const handleDeleteSuite = async (suiteId: string, suiteName: string) => {
    if (!window.confirm(`Are you sure you want to delete '${suiteName}'? This will also remove any assigned physical rooms.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/rooms/types/${suiteId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Room suite '${suiteName}' deleted successfully`);
        loadDashboardData();
      } else {
        setActionError(data.error || 'Failed to delete room suite');
      }
    } catch (err) {
      setActionError('Network error while deleting room suite');
    }
  };

  const filteredRooms = rooms.filter(r => floorFilter === 'all' || r.floor.toString() === floorFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 md:pb-12 text-[#18181B] dark:text-[#f4f4f5]">
      
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 sm:pb-6 border-b border-[#E8E4DA] dark:border-[#27272a] gap-3.5 mb-5 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#71717A] dark:text-[#a1a1aa] mb-1 uppercase tracking-wider font-semibold">
            <span>Hotel Operations Console</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#B89358]">{user?.role === 'admin' ? 'General Management (Admin)' : 'Front Desk Officer'}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-light text-[#18181B] dark:text-[#f4f4f5]">
            Grand Luxe Hospitality &amp; Inventory Hub
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setWalkinModalOpen(true)}
            className="flex-1 sm:flex-initial px-3.5 py-2.5 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] hover:bg-[#B89358] dark:hover:bg-[#8C6A32] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Walk-in</span>
          </button>

          <button
            onClick={loadDashboardData}
            className="p-2.5 min-h-[44px] min-w-[44px] border border-[#D4CFBE] dark:border-[#3f3f46] rounded-lg text-[#52525B] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white bg-white dark:bg-[#18181b] flex items-center justify-center transition-colors cursor-pointer"
            title="Refresh Data"
            aria-label="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#B89358]' : ''}`} />
          </button>
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-900 font-bold p-1">&times;</button>
        </div>
      )}

      {actionError && (
        <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-lg flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-red-900 font-bold p-1">&times;</button>
        </div>
      )}

      {/* KPI Metrics Bar (2 cols on mobile, 3 on tablet, 6 on desktop) */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3 mb-6 sm:mb-8">
          
          <div className="bg-white dark:bg-[#14171f] p-3 sm:p-3.5 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs transition-colors">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] block">Occupancy</span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#f4f4f5] tabular-nums mt-0.5 block">
              {metrics.occupancyRate}%
            </span>
            <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]">{metrics.occupiedRooms}/{metrics.totalRooms} rooms</span>
          </div>

          <div className="bg-white dark:bg-[#14171f] p-3 sm:p-3.5 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs transition-colors">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] block">Available</span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5 block">
              {metrics.availableRooms}
            </span>
            <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]">Ready to assign</span>
          </div>

          <div className="bg-white dark:bg-[#14171f] p-3 sm:p-3.5 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs transition-colors">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] block">Arrivals</span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-blue-700 dark:text-blue-400 tabular-nums mt-0.5 block">
              {arrivals.length}
            </span>
            <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]">Due today</span>
          </div>

          <div className="bg-white dark:bg-[#14171f] p-3 sm:p-3.5 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs transition-colors">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] block">Departures</span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-amber-700 dark:text-amber-400 tabular-nums mt-0.5 block">
              {departures.length}
            </span>
            <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]">Check-outs due</span>
          </div>

          <div className="bg-white dark:bg-[#14171f] p-3 sm:p-3.5 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs transition-colors">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] block">ADR</span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#18181B] dark:text-[#f4f4f5] tabular-nums mt-0.5 block">
              ${Number(metrics.adr || 0).toFixed(0)}
            </span>
            <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]">Average daily rate</span>
          </div>

          <div className="bg-white dark:bg-[#14171f] p-3 sm:p-3.5 rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs transition-colors">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] block">RevPAR</span>
            <span className="font-serif text-xl sm:text-2xl font-bold text-[#B89358] dark:text-[#d8b77d] tabular-nums mt-0.5 block">
              ${Number(metrics.revpar || 0).toFixed(0)}
            </span>
            <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]">Yield per room</span>
          </div>

        </div>
      )}

      {/* Management Navigation Tabs (Mobile Horizontal Swipe) */}
      <div className="flex border-b border-[#E8E4DA] dark:border-[#27272a] mb-6 overflow-x-auto text-xs font-medium text-[#71717A] dark:text-[#a1a1aa] gap-1 sm:gap-2 pb-0 scrollbar-none">
        <button
          onClick={() => setActiveSubTab('frontdesk')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center ${
            activeSubTab === 'frontdesk' ? 'border-[#B89358] text-[#18181B] dark:text-white font-semibold' : 'border-transparent hover:text-[#18181B] dark:hover:text-white'
          }`}
        >
          Front Desk ({arrivals.length})
        </button>

        <button
          onClick={() => setActiveSubTab('matrix')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center ${
            activeSubTab === 'matrix' ? 'border-[#B89358] text-[#18181B] dark:text-white font-semibold' : 'border-transparent hover:text-[#18181B] dark:hover:text-white'
          }`}
        >
          Room Matrix ({rooms.length})
        </button>

        <button
          onClick={() => setActiveSubTab('suites')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'suites' ? 'border-[#B89358] text-[#18181B] dark:text-white font-semibold' : 'border-transparent hover:text-[#18181B] dark:hover:text-white'
          }`}
        >
          <BedDouble className="w-3.5 h-3.5 text-[#B89358]" />
          <span>Suites &amp; Room Info ({roomTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reservations')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center ${
            activeSubTab === 'reservations' ? 'border-[#B89358] text-[#18181B] dark:text-white font-semibold' : 'border-transparent hover:text-[#18181B] dark:hover:text-white'
          }`}
        >
          Reservations ({reservations.length})
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'users' ? 'border-[#B89358] text-[#18181B] dark:text-white font-semibold' : 'border-transparent hover:text-[#18181B] dark:hover:text-white'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-[#B89358]" />
          <span>Registered Guests &amp; Profiles ({allUsers.length})</span>
        </button>

        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <button
            onClick={() => setActiveSubTab('reports')}
            className={`py-3 px-3 sm:px-4 min-h-[44px] border-b-2 transition-colors whitespace-nowrap cursor-pointer flex items-center ${
              activeSubTab === 'reports' ? 'border-[#B89358] text-[#18181B] dark:text-white font-semibold' : 'border-transparent hover:text-[#18181B] dark:hover:text-white'
            }`}
          >
            Executive Yield &amp; Analytics
          </button>
        )}
      </div>

      {/* TAB 1: FRONT DESK & ARRIVALS */}
      {activeSubTab === 'frontdesk' && (
        <div className="space-y-6 sm:space-y-8">
          
          {/* Today's Expected Arrivals */}
          <div className="bg-white dark:bg-[#12151b] rounded-xl border border-[#E8E4DA] dark:border-[#27272a] p-4 sm:p-6 shadow-xs transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-normal text-[#18181B] dark:text-white">Today's Guest Arrivals</h3>
                <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">Check-in protocol &amp; keycard issuance.</p>
              </div>
              <span className="text-xs font-semibold text-[#B89358]">{arrivals.length} Due</span>
            </div>

            {arrivals.length === 0 ? (
              <p className="text-xs text-[#71717A] dark:text-[#a1a1aa] py-6 text-center italic">No pending arrivals scheduled for today.</p>
            ) : (
              <>
                {/* Mobile Card List for Arrivals */}
                <div className="block md:hidden space-y-3">
                  {arrivals.map(arr => (
                    <div key={arr.id} className="p-3.5 bg-[#FAF9F6] dark:bg-[#181c24] border border-[#E8E4DA] dark:border-[#27272a] rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-[#18181B] dark:text-white">{arr.guest_name}</p>
                          <span className="font-mono text-[10px] text-[#71717A] dark:text-[#a1a1aa]">{arr.id}</span>
                        </div>
                        {arr.assigned_room_id ? (
                          <span className="font-semibold text-xs text-[#B89358]">Room {arr.assigned_room_id}</span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 text-xs font-medium">Unassigned</span>
                        )}
                      </div>

                      <div className="text-xs text-[#52525B] dark:text-[#d4d4d8]">
                        <p>{arr.room_type_name}</p>
                        <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{arr.check_in_date} → {arr.check_out_date}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-[#E8E4DA] dark:border-[#27272a]">
                        <span className="font-mono font-medium text-xs text-[#18181B] dark:text-white">
                          ${parseFloat(arr.total_price.toString()).toLocaleString()}
                        </span>
                        <div className="flex gap-2">
                          {arr.status === 'checked_in' ? (
                            <span className="text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded text-[11px] border border-emerald-200 dark:border-emerald-800">
                              Checked In
                            </span>
                          ) : (
                            <button
                              onClick={() => handleCheckIn(arr.id, arr.assigned_room_id)}
                              className="px-3 py-2 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white rounded-lg font-medium text-xs cursor-pointer shadow-xs"
                            >
                              Check In
                            </button>
                          )}
                          <button
                            onClick={() => handleOpenFolio(arr.id)}
                            className="px-3 py-2 min-h-[44px] border border-[#D4CFBE] dark:border-[#3f3f46] dark:text-[#d4d4d8] hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 rounded-lg text-xs cursor-pointer"
                          >
                            Folio
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View for Arrivals */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E8E4DA] dark:border-[#27272a] text-[#71717A] dark:text-[#a1a1aa] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Code</th>
                        <th className="py-2.5">Guest</th>
                        <th className="py-2.5">Suite Category</th>
                        <th className="py-2.5">Allocated Room</th>
                        <th className="py-2.5">Dates</th>
                        <th className="py-2.5">Folio Total</th>
                        <th className="py-2.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE8] dark:divide-[#27272a]">
                      {arrivals.map(arr => (
                        <tr key={arr.id} className="hover:bg-[#FAF9F6]/60 dark:hover:bg-zinc-800/40">
                          <td className="py-3 font-mono font-semibold text-[#18181B] dark:text-white">{arr.id}</td>
                          <td className="py-3">
                            <p className="font-semibold text-[#18181B] dark:text-white">{arr.guest_name}</p>
                            <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{arr.guest_phone || arr.guest_email}</p>
                          </td>
                          <td className="py-3 text-[#27272A] dark:text-[#d4d4d8]">{arr.room_type_name}</td>
                          <td className="py-3">
                            {arr.assigned_room_id ? (
                              <span className="font-semibold text-[#B89358]">Room {arr.assigned_room_id}</span>
                            ) : (
                              <span className="text-amber-700 dark:text-amber-400 font-medium">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 text-[#71717A] dark:text-[#a1a1aa]">{arr.check_in_date} → {arr.check_out_date}</td>
                          <td className="py-3 font-mono font-medium text-[#18181B] dark:text-white tabular-nums">
                            ${parseFloat(arr.total_price.toString()).toLocaleString()}
                          </td>
                          <td className="py-3 text-right space-x-2">
                            {arr.status === 'checked_in' ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded text-[11px] border border-emerald-200 dark:border-emerald-800">
                                Checked In
                              </span>
                            ) : (
                              <button
                                onClick={() => handleCheckIn(arr.id, arr.assigned_room_id)}
                                className="px-3 py-1.5 bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white rounded font-medium text-xs transition-colors cursor-pointer"
                              >
                                Check In
                              </button>
                            )}
                            <button
                              onClick={() => handleOpenFolio(arr.id)}
                              className="px-2.5 py-1.5 border border-[#D4CFBE] dark:border-[#3f3f46] hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 text-[#27272A] dark:text-[#d4d4d8] rounded font-medium text-xs transition-colors cursor-pointer"
                            >
                              Folio
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Currently In-House Guests */}
          <div className="bg-white rounded-xl border border-[#E8E4DA] p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-normal text-[#18181B] dark:text-white">Currently In-House Residency ({inHouseGuests.length})</h3>
                <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">Active guest folios &amp; incidentals.</p>
              </div>
            </div>

            {inHouseGuests.length === 0 ? (
              <p className="text-xs text-[#71717A] dark:text-[#a1a1aa] py-6 text-center italic">No guests currently in-house.</p>
            ) : (
              <>
                {/* Mobile Card Stack */}
                <div className="block md:hidden space-y-3">
                  {inHouseGuests.map(guest => (
                    <div key={guest.id} className="p-3.5 bg-[#FAF9F6] dark:bg-[#181c24] border border-[#E8E4DA] dark:border-[#27272a] rounded-xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-sm text-[#18181B] dark:text-white">{guest.guest_name}</p>
                          <span className="text-xs font-bold text-[#B89358]">Room {guest.assigned_room_id}</span>
                        </div>
                        <span className="font-mono text-xs font-semibold tabular-nums text-[#18181B] dark:text-white">
                          ${parseFloat(guest.total_price.toString()).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">{guest.room_type_name} · Departure: {guest.check_out_date}</p>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-[#E8E4DA] dark:border-[#27272a]">
                        <button
                          onClick={() => {
                            setChargeModalResId(guest.id);
                            setChargeDesc('Le Belvédère - Signature Dinner');
                            setChargeAmount('125.00');
                          }}
                          className="flex-1 px-2.5 py-2 min-h-[44px] bg-[#B89358]/15 text-[#8C6A32] dark:text-[#d8b77d] rounded-lg font-medium text-xs text-center cursor-pointer"
                        >
                          + Post Charge
                        </button>
                        <button
                          onClick={() => handleCheckOut(guest.id)}
                          className="flex-1 px-2.5 py-2 min-h-[44px] border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 rounded-lg font-medium text-xs text-center cursor-pointer"
                        >
                          Check Out
                        </button>
                        <button
                          onClick={() => handleOpenFolio(guest.id)}
                          className="px-3 py-2 min-h-[44px] border border-[#D4CFBE] dark:border-[#3f3f46] text-[#18181B] dark:text-[#d4d4d8] hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 rounded-lg text-xs cursor-pointer"
                        >
                          Folio
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-[#E8E4DA] dark:border-[#27272a] text-[#71717A] dark:text-[#a1a1aa] uppercase tracking-wider text-[10px]">
                        <th className="py-2.5">Room</th>
                        <th className="py-2.5">Guest Name</th>
                        <th className="py-2.5">Suite Type</th>
                        <th className="py-2.5">Departure Date</th>
                        <th className="py-2.5">Current Folio</th>
                        <th className="py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2EFE8] dark:divide-[#27272a]">
                      {inHouseGuests.map(guest => (
                        <tr key={guest.id} className="hover:bg-[#FAF9F6]/60 dark:hover:bg-zinc-800/40">
                          <td className="py-3 font-bold text-sm text-[#B89358]">Room {guest.assigned_room_id}</td>
                          <td className="py-3 font-medium text-[#18181B] dark:text-white">{guest.guest_name}</td>
                          <td className="py-3 text-[#52525B] dark:text-[#d4d4d8]">{guest.room_type_name}</td>
                          <td className="py-3 text-[#71717A] dark:text-[#a1a1aa]">{guest.check_out_date}</td>
                          <td className="py-3 font-mono font-medium text-[#18181B] dark:text-white tabular-nums">
                            ${parseFloat(guest.total_price.toString()).toLocaleString()}
                          </td>
                          <td className="py-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setChargeModalResId(guest.id);
                                setChargeDesc('Le Belvédère - Signature Dinner');
                                setChargeAmount('125.00');
                              }}
                              className="px-2.5 py-1.5 bg-[#B89358]/15 text-[#8C6A32] dark:text-[#d8b77d] hover:bg-[#B89358]/25 rounded font-medium text-xs transition-colors cursor-pointer"
                            >
                              + Post Charge
                            </button>
                            <button
                              onClick={() => handleCheckOut(guest.id)}
                              className="px-2.5 py-1.5 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded font-medium text-xs transition-colors cursor-pointer"
                            >
                              Check Out
                            </button>
                            <button
                              onClick={() => handleOpenFolio(guest.id)}
                              className="px-2.5 py-1.5 border border-[#D4CFBE] dark:border-[#3f3f46] hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 text-[#27272A] dark:text-[#d4d4d8] rounded font-medium text-xs transition-colors cursor-pointer"
                            >
                              Statement
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* TAB 2: ROOM MATRIX & FLOOR PLAN */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-5 sm:space-y-6">
          
          {/* Level Filter Bar & Management Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 bg-white dark:bg-[#12151b] rounded-xl border border-[#E8E4DA] dark:border-[#27272a] transition-colors">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#71717A] dark:text-[#a1a1aa]">Level:</span>
              <div className="flex flex-wrap gap-1 text-xs">
                {['all', '1', '2', '3', '8'].map(fl => (
                  <button
                    key={fl}
                    onClick={() => setFloorFilter(fl)}
                    className={`px-3 py-1.5 rounded-lg border min-h-[36px] transition-colors cursor-pointer ${
                      floorFilter === fl ? 'bg-[#18181B] dark:bg-[#B89358] text-white dark:text-[#0c0e12] border-[#18181B] dark:border-[#B89358] font-semibold' : 'bg-[#FAF9F6] dark:bg-[#181c24] border-[#D4CFBE] dark:border-[#27272a] text-[#52525B] dark:text-[#d4d4d8]'
                    }`}
                  >
                    {fl === 'all' ? 'All' : fl === '8' ? 'Penthouse' : `Fl ${fl}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Legend */}
              <div className="flex flex-wrap items-center gap-2.5 text-[10px] sm:text-[11px] text-[#71717A] dark:text-[#a1a1aa]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Avail</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Occupied</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Reserved</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Cleaning</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Maint</span>
              </div>

              {/* Add Room Unit Button */}
              <button
                onClick={handleOpenCreateRoom}
                className="px-3 py-1.5 min-h-[36px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#B89358] dark:text-[#0c0e12]" />
                <span>+ Add Room Unit</span>
              </button>
            </div>
          </div>

          {/* Interactive Room Grid (1 col on small mobile, 2 on tablet, 4 on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {filteredRooms.map(room => (
              <div
                key={room.id}
                className="bg-white dark:bg-[#12151b] rounded-xl border border-[#E8E4DA] dark:border-[#27272a] p-4 shadow-xs hover:border-[#D4CFBE] dark:hover:border-[#3f3f46] flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-serif text-xl sm:text-2xl font-bold text-[#18181B] dark:text-white">
                      {room.id.startsWith('GV') || room.id.startsWith('PH') ? room.id : `Room ${room.id}`}
                    </span>
                    {getRoomBadge(room.status)}
                  </div>

                  <p className="text-xs font-medium text-[#52525B] dark:text-[#d4d4d8] mb-0.5">{room.room_type_name}</p>
                  <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa] mb-3">Floor {room.floor} · Base ${room.base_price}/night</p>

                  {room.guest_name ? (
                    <div className="p-2.5 bg-[#FAF9F6] dark:bg-[#181c24] rounded-lg border border-[#EBE7DD] dark:border-[#27272a] text-xs text-[#27272A] dark:text-[#e4e4e7] mb-3">
                      <p className="font-semibold truncate">{room.guest_name}</p>
                      <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{room.check_in_date} → {room.check_out_date}</p>
                    </div>
                  ) : (
                    <div className="p-2.5 bg-[#FAF9F6]/50 dark:bg-[#181c24]/50 rounded-lg border border-[#F0ECE1] dark:border-[#27272a] text-[11px] text-[#A1A1AA] dark:text-zinc-500 italic mb-3">
                      {room.notes || 'Ready for occupancy'}
                    </div>
                  )}
                </div>

                {/* Status Toggle Selector & Unit Actions */}
                <div className="border-t border-[#F0ECE1] dark:border-[#27272a] pt-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-semibold text-[#71717A] dark:text-[#a1a1aa]">Status:</span>
                    <select
                      value={room.status}
                      onChange={(e) => handleUpdateRoomStatus(room.id, e.target.value)}
                      className="text-xs p-1.5 border border-[#D4CFBE] dark:border-[#3f3f46] rounded-lg bg-[#FAF9F6] dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
                    >
                      <option value="available" className="dark:bg-[#181c24]">Available</option>
                      <option value="occupied" className="dark:bg-[#181c24]">Occupied</option>
                      <option value="reserved" className="dark:bg-[#181c24]">Reserved</option>
                      <option value="cleaning" className="dark:bg-[#181c24]">Cleaning</option>
                      <option value="maintenance" className="dark:bg-[#181c24]">Maintenance</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRoom(room)}
                      className="px-2 py-1 bg-white dark:bg-[#181c24] border border-[#D4CFBE] dark:border-[#27272a] hover:border-[#B89358] text-[#52525B] dark:text-[#d4d4d8] hover:text-[#18181B] dark:hover:text-white text-[11px] rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Edit Room Unit"
                    >
                      <Edit className="w-3 h-3 text-[#B89358]" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoom(room.id)}
                      className="px-2 py-1 bg-white dark:bg-[#181c24] border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[11px] rounded flex items-center gap-1 transition-colors cursor-pointer"
                      title="Delete Room Unit"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* TAB: SUITES & ROOM INFO (ADD, EDIT, DELETE ROOM CATEGORIES & UPLOAD ROOM IMAGES) */}
      {activeSubTab === 'suites' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-[#12151b] rounded-xl border border-[#E8E4DA] dark:border-[#27272a] shadow-xs transition-colors">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#18181B] dark:text-white">
                Suites &amp; Room Information
              </h3>
              <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">
                Manage room specifications, luxury categories, amenities, nightly rates, and upload room images.
              </p>
            </div>
            <button
              onClick={handleOpenCreateSuite}
              className="px-4 py-2.5 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#B89358] dark:text-[#0c0e12]" />
              <span>+ Add Room Suite</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {roomTypes.map(st => (
              <div
                key={st.id}
                className="bg-white dark:bg-[#12151b] rounded-xl border border-[#E8E4DA] dark:border-[#27272a] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Suite Image Preview */}
                  <div className="relative h-48 w-full bg-[#FAF9F6] dark:bg-[#181c24] overflow-hidden group">
                    <img
                      src={st.image_url}
                      alt={st.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/hero_luxury_hotel_1790748121852.jpg';
                      }}
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded text-[10px] uppercase tracking-wider font-semibold text-white">
                      {st.category || 'Luxury Suite'}
                    </div>
                    <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md rounded-lg shadow-sm border dark:border-[#27272a]">
                      <span className="font-serif text-base font-bold text-[#18181B] dark:text-white">${st.base_price}</span>
                      <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]"> / night</span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <h4 className="font-serif text-lg font-medium text-[#18181B] dark:text-white">{st.name}</h4>
                      <p className="text-xs text-[#71717A] dark:text-[#a1a1aa] mt-1 line-clamp-2">{st.description}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 py-2 px-2.5 bg-[#FAF9F6] dark:bg-[#181c24] rounded-lg text-center border border-[#E8E4DA]/60 dark:border-[#27272a]">
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#71717A] dark:text-[#a1a1aa] block">Size</span>
                        <span className="text-xs font-semibold text-[#18181B] dark:text-white">{st.size_sqm} m²</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#71717A] dark:text-[#a1a1aa] block">Guests</span>
                        <span className="text-xs font-semibold text-[#18181B] dark:text-white">Up to {st.max_occupancy}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase tracking-wider text-[#71717A] dark:text-[#a1a1aa] block">Units</span>
                        <span className="text-xs font-semibold text-[#B89358]">{st.available_units}/{st.total_units} Avail</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#71717A] dark:text-[#a1a1aa] block mb-1">
                        Bed &amp; View
                      </span>
                      <p className="text-xs text-[#27272A] dark:text-[#d4d4d8]">{st.bed_type} · {st.view_type}</p>
                    </div>

                    {st.amenities && st.amenities.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {st.amenities.slice(0, 3).map((a, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#FAF9F6] dark:bg-[#181c24] border border-[#E8E4DA] dark:border-[#27272a] rounded text-[10px] text-[#52525B] dark:text-[#d4d4d8]">
                            {a}
                          </span>
                        ))}
                        {st.amenities.length > 3 && (
                          <span className="px-1.5 py-0.5 text-[10px] text-[#B89358] font-medium">
                            +{st.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="p-4 pt-2 border-t border-[#F2EFE8] dark:border-[#27272a] flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenEditSuite(st)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-[#181c24] border border-[#D4CFBE] dark:border-[#27272a] hover:border-[#B89358] hover:bg-[#FAF8F5] text-[#18181B] dark:text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5 text-[#B89358]" />
                    <span>Edit Info &amp; Image</span>
                  </button>
                  <button
                    onClick={() => handleDeleteSuite(st.id, st.name)}
                    className="p-2 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                    title="Delete Suite"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: RESERVATIONS LEDGER */}
      {activeSubTab === 'reservations' && (
        <div className="bg-white dark:bg-[#12151b] rounded-xl border border-[#E8E4DA] dark:border-[#27272a] p-4 sm:p-6 shadow-xs transition-colors">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#18181B] dark:text-white">Central Registry</h3>
              <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">Complete ledger of guest reservations.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={resStatusFilter}
                onChange={(e) => setResStatusFilter(e.target.value)}
                className="text-xs p-2.5 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-[#FAF9F6] dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
              >
                <option value="all" className="dark:bg-[#181c24]">All Statuses</option>
                <option value="confirmed" className="dark:bg-[#181c24]">Confirmed</option>
                <option value="checked_in" className="dark:bg-[#181c24]">Checked In</option>
                <option value="checked_out" className="dark:bg-[#181c24]">Checked Out</option>
                <option value="cancelled" className="dark:bg-[#181c24]">Cancelled</option>
              </select>

              <div className="relative">
                <input
                  type="text"
                  value={resSearch}
                  onChange={(e) => setResSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadDashboardData()}
                  placeholder="Search guest or code..."
                  className="text-xs px-3 py-2.5 pl-8 border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-[#FAF9F6] dark:bg-[#181c24] text-[#18181B] dark:text-white placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] w-full sm:w-48 min-h-[44px] focus:outline-none focus:border-[#B89358]"
                />
                <Search className="w-3.5 h-3.5 text-[#71717A] dark:text-[#a1a1aa] absolute left-2.5 top-3.5" />
              </div>
            </div>
          </div>

          {/* Mobile Card Stack for Reservations */}
          <div className="block md:hidden space-y-3">
            {reservations.map(res => {
              const matchedUser = allUsers.find(u => (res.user_id && u.id === res.user_id) || (res.guest_email && u.email.toLowerCase() === res.guest_email.toLowerCase()));
              return (
                <div key={res.id} className="p-3.5 bg-[#FAF9F6] dark:bg-[#181c24] border border-[#E8E4DA] dark:border-[#27272a] rounded-xl space-y-2.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-xs text-[#18181B] dark:text-white">{res.id}</span>
                        {matchedUser && (
                          <span className="font-mono text-[10px] text-[#B89358] bg-[#B89358]/10 px-1.5 py-0.2 rounded font-semibold">
                            @{matchedUser.username}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm text-[#18181B] dark:text-white mt-0.5">{res.guest_name}</p>
                      <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{res.guest_email}</p>
                    </div>
                    <span className="text-xs">{getRoomBadge(res.status === 'checked_in' ? 'occupied' : res.status)}</span>
                  </div>

                  <div className="text-xs text-[#52525B] dark:text-[#d4d4d8] bg-white dark:bg-[#12151b] p-2.5 rounded-lg border border-[#EAE6DC] dark:border-[#27272a] space-y-1">
                    <p className="font-medium text-[#18181B] dark:text-white">{res.room_type_name}</p>
                    <p className="text-[11px] text-[#71717A] dark:text-[#a1a1aa]">{res.check_in_date} → {res.check_out_date} ({res.guests_count || 1} guests)</p>
                    {res.add_ons && res.add_ons.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {res.add_ons.map((a, i) => (
                          <span key={i} className="text-[10px] text-[#B89358] bg-[#FAF9F6] dark:bg-[#181c24] px-1.5 py-0.5 rounded border border-[#E8E4DA] dark:border-[#27272a]">
                            ✦ {a.name} (${a.price})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] text-[#71717A] block">Room</span>
                      {res.assigned_room_id ? (
                        <span className="font-semibold text-xs text-[#B89358]">Room {res.assigned_room_id}</span>
                      ) : (
                        <button
                          onClick={() => setAssignRoomModalBooking(res)}
                          className="text-[11px] text-amber-700 underline font-medium cursor-pointer"
                        >
                          + Assign
                        </button>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#71717A] block">Folio</span>
                      <span className="font-mono font-bold text-xs text-[#18181B]">
                        ${parseFloat(res.total_price.toString()).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      {res.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(res.id, res.assigned_room_id)}
                          className="px-2.5 py-1.5 min-h-[36px] bg-[#18181B] text-white rounded text-xs cursor-pointer"
                        >
                          Check In
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenFolio(res.id)}
                        className="px-2.5 py-1.5 min-h-[36px] border border-[#D4CFBE] rounded text-xs cursor-pointer hover:bg-white"
                      >
                        Folio
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-[#E8E4DA] text-[#71717A] uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Guest Profile</th>
                  <th className="py-2.5 px-3">Booked Suite &amp; Add-ons</th>
                  <th className="py-2.5 px-3">Stay Dates</th>
                  <th className="py-2.5 px-3">Room</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Total Folio</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2EFE8]">
                {reservations.map(res => {
                  const matchedUser = allUsers.find(u => (res.user_id && u.id === res.user_id) || (res.guest_email && u.email.toLowerCase() === res.guest_email.toLowerCase()));
                  return (
                    <tr key={res.id} className="hover:bg-[#FAF9F6]/50">
                      <td className="py-3 px-3 font-mono font-bold text-[#18181B]">{res.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-semibold text-[#18181B] block">{res.guest_name}</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#71717A]">
                          <span>{res.guest_email}</span>
                          {matchedUser && (
                            <span className="font-mono text-[#B89358] font-medium bg-[#B89358]/10 px-1 rounded">
                              @{matchedUser.username}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-[#18181B]">{res.room_type_name}</div>
                        {res.add_ons && res.add_ons.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {res.add_ons.map((a, i) => (
                              <span key={i} className="text-[9px] text-[#B89358] bg-[#FAF9F6] border border-[#E8E4DA] px-1 py-0.2 rounded">
                                + {a.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-[#71717A] whitespace-nowrap">
                        <div>{res.check_in_date} → {res.check_out_date}</div>
                        <div className="text-[10px] text-[#A1A1AA]">{res.guests_count || 1} Guests</div>
                      </td>
                      <td className="py-3 px-3">
                        {res.assigned_room_id ? (
                          <span className="font-semibold text-[#B89358]">Room {res.assigned_room_id}</span>
                        ) : (
                          <button
                            onClick={() => setAssignRoomModalBooking(res)}
                            className="text-[11px] text-amber-700 underline font-medium cursor-pointer"
                          >
                            + Assign
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-3 capitalize">
                        <div>{getRoomBadge(res.status === 'checked_in' ? 'occupied' : res.status)}</div>
                        <div className="text-[10px] text-emerald-700 font-medium">{res.payment_status}</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold tabular-nums text-[#18181B]">
                        ${parseFloat(res.total_price.toString()).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        {res.status === 'confirmed' && (
                          <button
                            onClick={() => handleCheckIn(res.id, res.assigned_room_id)}
                            className="px-2.5 py-1.5 bg-[#18181B] hover:bg-[#B89358] text-white rounded text-[11px] cursor-pointer transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenFolio(res.id)}
                          className="px-2.5 py-1.5 border border-[#D4CFBE] hover:bg-white rounded text-[11px] cursor-pointer"
                        >
                          Folio
                        </button>
                        <button
                          onClick={() => {
                            setChargeModalResId(res.id);
                            setChargeDesc('Le Belvédère - In-Suite Dining');
                            setChargeAmount('65.00');
                          }}
                          className="px-2.5 py-1.5 bg-[#FAF9F6] border border-[#E8E4DA] hover:border-[#B89358] text-[#18181B] rounded text-[11px] cursor-pointer"
                        >
                          + Charge
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: REPORTS & ANALYTICS */}
      {activeSubTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[#E8E4DA] p-5 sm:p-6 shadow-xs">
            <h3 className="font-serif text-xl font-normal text-[#18181B] mb-2">Hospitality Performance</h3>
            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center p-3 bg-[#FAF9F6] rounded-lg">
                <span className="text-[#71717A]">Gross Revenue</span>
                <span className="font-serif text-xl font-bold text-[#18181B] tabular-nums">
                  ${metrics ? Number(metrics.totalRevenue || 0).toLocaleString() : '0'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#FAF9F6] rounded-lg">
                <span className="text-[#71717A]">Average Daily Rate (ADR)</span>
                <span className="font-serif text-lg font-bold text-[#B89358] tabular-nums">
                  ${metrics ? Number(metrics.adr || 0).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-[#FAF9F6] rounded-lg">
                <span className="text-[#71717A]">RevPAR</span>
                <span className="font-serif text-lg font-bold text-[#B89358] tabular-nums">
                  ${metrics ? Number(metrics.revpar || 0).toFixed(2) : '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#E8E4DA] p-5 sm:p-6 shadow-xs">
            <h3 className="font-serif text-xl font-normal text-[#18181B] mb-2">Monthly Occupancy Trend</h3>
            <div className="space-y-2.5">
              {monthlyTrend.map(item => (
                <div key={item.month} className="text-xs">
                  <div className="flex justify-between text-[#52525B] mb-1">
                    <span>{item.month}</span>
                    <span className="tabular-nums font-semibold text-[#18181B]">${item.revenue.toLocaleString()} ({item.occupancy}%)</span>
                  </div>
                  <div className="w-full h-2.5 bg-[#FAF9F6] rounded-full overflow-hidden border border-[#E8E4DA]">
                    <div
                      className="h-full bg-[#B89358] rounded-full"
                      style={{ width: `${(item.revenue / 150000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: REGISTERED GUESTS & PROFILES (WITH WHAT THEY BOOKED) */}
      {activeSubTab === 'users' && (
        <div className="space-y-6">
          
          {/* Top Controls & Search Bar */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#E8E4DA] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#71717A] absolute left-3 top-3.5" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search registered guests by name, @username, email, or phone..."
                className="w-full pl-9 pr-4 py-2.5 min-h-[44px] text-xs border border-[#D4CFBE] rounded-lg bg-[#FAF9F6] focus:outline-none focus:border-[#B89358]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">Role:</span>
              {(['all', 'guest', 'staff', 'admin', 'superadmin'] as const).map(role => (
                <button
                  key={role}
                  onClick={() => setUserRoleFilter(role)}
                  className={`px-3 py-1.5 min-h-[36px] text-xs rounded-lg transition-all capitalize cursor-pointer font-medium ${
                    userRoleFilter === role
                      ? 'bg-[#18181B] text-white shadow-xs'
                      : 'bg-[#FAF9F6] border border-[#E8E4DA] text-[#52525B] hover:text-[#18181B]'
                  }`}
                >
                  {role === 'guest' ? 'Palace Guests' : role}
                </button>
              ))}
              <button
                onClick={loadDashboardData}
                className="p-2 min-h-[36px] min-w-[36px] bg-[#FAF9F6] hover:bg-[#F2EFE8] border border-[#E8E4DA] text-[#18181B] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
                title="Refresh Guests"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#B89358]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA] shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold block">Registered Users</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#18181B] block mt-0.5">{allUsers.length}</span>
              <span className="text-[10px] text-[#71717A]">In centralized database</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA] shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold block">Palace Guests</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#B89358] block mt-0.5">
                {allUsers.filter(u => u.role === 'guest').length}
              </span>
              <span className="text-[10px] text-[#71717A]">Client accounts</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA] shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold block">Users With Stays</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-emerald-700 block mt-0.5">
                {allUsers.filter(u => (u.bookings_count || 0) > 0).length}
              </span>
              <span className="text-[10px] text-[#71717A]">Active &amp; past bookings</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-[#E8E4DA] shadow-xs">
              <span className="text-[10px] uppercase tracking-wider text-[#71717A] font-semibold block">Guest Revenue</span>
              <span className="font-serif text-xl sm:text-2xl font-bold text-[#18181B] block mt-0.5">
                ${allUsers.reduce((sum, u) => sum + (u.total_spent || 0), 0).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#71717A]">Total registered folio yield</span>
            </div>
          </div>

          {/* User Cards List with Bookings */}
          <div className="space-y-4">
            {allUsers
              .filter(u => {
                if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
                if (!userSearchQuery) return true;
                const q = userSearchQuery.toLowerCase();
                return (
                  u.name.toLowerCase().includes(q) ||
                  u.email.toLowerCase().includes(q) ||
                  u.username?.toLowerCase().includes(q) ||
                  (u.phone && u.phone.includes(q))
                );
              })
              .map(u => {
                const isExpanded = expandedUserId === u.id || (expandedUserId === null && (u.bookings_count || 0) > 0);
                const hasBookings = (u.bookings_count || 0) > 0 || (u.bookings && u.bookings.length > 0);

                return (
                  <div key={u.id} className="bg-white rounded-xl border border-[#E8E4DA] shadow-xs overflow-hidden transition-all">
                    
                    {/* User Card Top Row */}
                    <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-[#18181B] text-[#FAF9F6] flex items-center justify-center font-serif font-bold text-sm shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-base text-[#18181B]">{u.name}</h4>
                            <span className="font-mono text-xs text-[#B89358]">@{u.username}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold ${
                              u.role === 'superadmin' ? 'bg-purple-50 text-purple-800 border border-purple-200' :
                              u.role === 'admin' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              u.role === 'staff' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                              'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}>
                              {u.role}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#71717A] mt-1">
                            <span>{u.email}</span>
                            {u.phone && <span>· {u.phone}</span>}
                            <span>· Registered: {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Booking summary pill + Expand button */}
                      <div className="flex items-center gap-3 self-end md:self-center">
                        <div className="text-right">
                          <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">Bookings &amp; Spend</span>
                          <span className="font-semibold text-xs text-[#18181B]">
                            {u.bookings_count || (u.bookings?.length || 0)} Stays
                          </span>
                          {u.total_spent ? (
                            <span className="text-[#B89358] font-bold text-xs ml-1.5">
                              (${u.total_spent.toLocaleString()})
                            </span>
                          ) : null}
                        </div>

                        <button
                          onClick={() => setExpandedUserId(expandedUserId === u.id ? -1 : u.id)}
                          className="px-3 py-2 min-h-[40px] bg-[#FAF9F6] hover:bg-[#F2EFE8] border border-[#E8E4DA] text-xs font-medium text-[#18181B] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>{hasBookings ? 'What They Booked' : 'View Profile'}</span>
                          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                      </div>

                    </div>

                    {/* Expandable Section: What They Booked */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-[#F2EFE8] bg-[#FAF9F6]/50">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-[11px] uppercase tracking-wider font-semibold text-[#18181B] flex items-center gap-1.5">
                            <BedDouble className="w-3.5 h-3.5 text-[#B89358]" />
                            <span>Reservations On Record ({u.bookings?.length || 0})</span>
                          </span>

                          {user?.role === 'admin' && u.role !== 'superadmin' && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[10px] text-[#71717A] uppercase">Assign Position:</span>
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                                className="p-1 text-xs border border-[#D4CFBE] rounded bg-white text-[#18181B]"
                              >
                                <option value="guest">Guest</option>
                                <option value="staff">Staff</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                          )}
                        </div>

                        {!u.bookings || u.bookings.length === 0 ? (
                          <div className="p-4 text-center bg-white rounded-lg border border-[#E8E4DA] text-xs text-[#71717A]">
                            No suite bookings placed yet under this registered profile.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {u.bookings.map((booking) => (
                              <div
                                key={booking.id}
                                className="bg-white p-3.5 sm:p-4 rounded-xl border border-[#E8E4DA] shadow-2xs hover:border-[#D4CFBE] transition-colors"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#F2EFE8] pb-3">
                                  <div className="flex items-center gap-3">
                                    {booking.image_url && (
                                      <img
                                        src={booking.image_url}
                                        alt={booking.room_type_name}
                                        className="w-12 h-12 object-cover rounded-lg bg-[#FAF9F6] shrink-0"
                                      />
                                    )}
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-xs text-[#18181B]">{booking.id}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                                          booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                                          booking.status === 'checked_in' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                                          booking.status === 'checked_out' ? 'bg-gray-100 text-gray-700' :
                                          'bg-red-50 text-red-800 border border-red-200'
                                        }`}>
                                          {booking.status.replace('_', ' ')}
                                        </span>
                                      </div>
                                      <h5 className="font-serif text-base font-medium text-[#18181B] mt-0.5">
                                        {booking.room_type_name}
                                      </h5>
                                    </div>
                                  </div>

                                  <div className="sm:text-right">
                                    <span className="text-[10px] text-[#71717A] uppercase tracking-wider block">Total Folio</span>
                                    <span className="font-serif text-base font-bold text-[#B89358]">
                                      ${booking.total_price.toLocaleString()}
                                    </span>
                                    <span className="block text-[10px] text-emerald-700 font-medium capitalize">
                                      {booking.payment_status}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-[#52525B] pt-2.5">
                                  <div>
                                    <span className="text-[#71717A] text-[10px] uppercase block">Stay Dates</span>
                                    <span className="font-medium text-[#18181B]">{booking.check_in_date} → {booking.check_out_date}</span>
                                  </div>
                                  <div>
                                    <span className="text-[#71717A] text-[10px] uppercase block">Physical Room</span>
                                    {booking.assigned_room_id ? (
                                      <span className="font-semibold text-[#B89358]">Room {booking.assigned_room_id}</span>
                                    ) : (
                                      <button
                                        onClick={() => setAssignRoomModalBooking(booking)}
                                        className="text-amber-700 underline font-medium text-xs cursor-pointer"
                                      >
                                        + Allocate Room
                                      </button>
                                    )}
                                  </div>
                                  <div>
                                    <span className="text-[#71717A] text-[10px] uppercase block">Party</span>
                                    <span className="font-medium text-[#18181B]">{booking.guests_count || 1} Guests</span>
                                  </div>
                                </div>

                                {booking.add_ons && booking.add_ons.length > 0 && (
                                  <div className="pt-2 mt-2 border-t border-[#F2EFE8]">
                                    <span className="text-[10px] text-[#71717A] uppercase font-semibold block mb-1">
                                      Reserved Add-on Services:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {booking.add_ons.map((addon, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-[#FAF9F6] border border-[#E8E4DA] rounded text-[10px] text-[#18181B] flex items-center gap-1">
                                          <span>✦ {addon.name}</span>
                                          <span className="font-mono text-[#B89358]">${addon.price}</span>
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Action Toolbar for this booking */}
                                <div className="flex flex-wrap items-center justify-end gap-2 pt-3 mt-2 border-t border-[#F2EFE8]">
                                  {booking.status === 'confirmed' && (
                                    <button
                                      onClick={() => handleCheckIn(booking.id, booking.assigned_room_id)}
                                      className="px-3 py-1.5 min-h-[36px] bg-[#18181B] hover:bg-[#B89358] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                    >
                                      Check In
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleOpenFolio(booking.id)}
                                    className="px-3 py-1.5 min-h-[36px] border border-[#D4CFBE] hover:bg-[#FAF9F6] text-xs font-medium text-[#27272A] rounded-lg transition-colors cursor-pointer"
                                  >
                                    View Folio
                                  </button>
                                  <button
                                    onClick={() => {
                                      setChargeModalResId(booking.id);
                                      setChargeDesc('Le Belvédère - In-Suite Dining');
                                      setChargeAmount('65.00');
                                    }}
                                    className="px-3 py-1.5 min-h-[36px] bg-[#B89358] hover:bg-[#8C6A32] text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
                                  >
                                    + Add Charge
                                  </button>
                                </div>

                              </div>
                            ))}
                          </div>
                        )}

                      </div>
                    )}

                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* MODAL 1: Folio Statement & Payment */}
      {selectedFolioId && currentFolioData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="relative bg-white dark:bg-[#12151b] w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#E8E4DA] dark:border-[#27272a] p-5 sm:p-8 max-h-[90vh] overflow-y-auto transition-colors">
            <button
              onClick={() => { setSelectedFolioId(null); setCurrentFolioData(null); }}
              className="absolute top-4 right-4 text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-[#E8E4DA] dark:border-[#27272a] pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#B89358] font-semibold">Guest Folio</span>
                <h3 className="font-serif text-xl sm:text-2xl text-[#18181B] dark:text-white">Folio #{currentFolioData.reservation_id}</h3>
                <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">
                  Guest: <strong className="text-[#18181B] dark:text-white">{currentFolioData.guest_name}</strong> · Room: <strong className="text-[#18181B] dark:text-white">{currentFolioData.room_number ? `Room ${currentFolioData.room_number}` : 'N/A'}</strong>
                </p>
              </div>

              <button
                onClick={() => {
                  setChargeModalResId(currentFolioData.reservation_id);
                  setChargeDesc('Le Belvédère - In-Suite Dining');
                  setChargeAmount('65.00');
                }}
                className="px-3 py-2 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white text-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                + Post Charge
              </button>
            </div>

            <div className="overflow-x-auto mb-6">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-[#E8E4DA] dark:border-[#27272a] text-[#71717A] dark:text-[#a1a1aa] uppercase text-[10px]">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EFE8] dark:divide-[#27272a]">
                  {currentFolioData.items.map(item => (
                    <tr key={item.id} className="hover:bg-[#FAF9F6]/50 dark:hover:bg-zinc-800/40">
                      <td className="py-2 font-medium text-[#18181B] dark:text-white">
                        {item.description}
                        <span className="block text-[10px] text-[#71717A] dark:text-[#a1a1aa] capitalize">{item.category}</span>
                      </td>
                      <td className="py-2 text-right font-mono tabular-nums whitespace-nowrap text-[#18181B] dark:text-white">${item.amount.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[#18181B] dark:border-zinc-600 font-semibold text-[#18181B] dark:text-white">
                    <td className="py-2.5 text-sm font-serif">Total Due</td>
                    <td className="py-2.5 text-right text-base font-serif text-[#B89358] tabular-nums whitespace-nowrap">
                      ${currentFolioData.total_charges.toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 pt-4 border-t border-[#E8E4DA] dark:border-[#27272a] pb-safe">
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold capitalize text-center sm:text-left">
                Status: {currentFolioData.payment_status}
              </span>
              <div className="flex gap-2">
                {currentFolioData.payment_status !== 'paid' && (
                  <button
                    onClick={() => handleSettleFolio(currentFolioData.reservation_id)}
                    className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] bg-emerald-700 dark:bg-emerald-600 hover:bg-emerald-800 text-white text-xs font-medium rounded-lg cursor-pointer"
                  >
                    Mark Paid
                  </button>
                )}
                <button
                  onClick={() => { setSelectedFolioId(null); setCurrentFolioData(null); }}
                  className="flex-1 sm:flex-initial px-4 py-2.5 min-h-[44px] bg-[#18181B] dark:bg-zinc-800 hover:bg-[#27272A] dark:hover:bg-zinc-700 text-white rounded-lg text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Post Charge Modal */}
      {chargeModalResId && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#12151b] w-full sm:max-w-md rounded-t-2xl sm:rounded-xl p-5 sm:p-6 shadow-2xl border border-[#E8E4DA] dark:border-[#27272a] pb-safe transition-colors">
            <h3 className="font-serif text-xl font-normal text-[#18181B] dark:text-white mb-1">Post Incidental Charge</h3>
            <p className="text-xs text-[#71717A] dark:text-[#a1a1aa] mb-4">Charge to Reservation #{chargeModalResId}</p>

            <form onSubmit={handlePostCharge} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={chargeDesc}
                  onChange={(e) => setChargeDesc(e.target.value)}
                  className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Category</label>
                  <select
                    value={chargeCategory}
                    onChange={(e) => setChargeCategory(e.target.value)}
                    className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
                  >
                    <option value="dining" className="dark:bg-[#181c24]">Dining &amp; Bar</option>
                    <option value="spa" className="dark:bg-[#181c24]">Thermal Spa</option>
                    <option value="transport" className="dark:bg-[#181c24]">Transportation</option>
                    <option value="service" className="dark:bg-[#181c24]">Service &amp; Laundry</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={chargeAmount}
                    onChange={(e) => setChargeAmount(e.target.value)}
                    className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white font-mono focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setChargeModalResId(null)}
                  className="flex-1 py-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg text-[#71717A] dark:text-[#a1a1aa] hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white rounded-lg font-medium cursor-pointer shadow-xs"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Assign Room Modal */}
      {assignRoomModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#12151b] w-full sm:max-w-md rounded-t-2xl sm:rounded-xl p-5 sm:p-6 shadow-2xl border border-[#E8E4DA] dark:border-[#27272a] pb-safe transition-colors">
            <h3 className="font-serif text-xl font-normal text-[#18181B] dark:text-white mb-1">Allocate Physical Room</h3>
            <p className="text-xs text-[#71717A] dark:text-[#a1a1aa] mb-4">
              Booking: <strong className="text-[#18181B] dark:text-white">{assignRoomModalBooking.guest_name}</strong> ({assignRoomModalBooking.room_type_name})
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Select Room Number</label>
                <select
                  value={selectedAssignRoomId}
                  onChange={(e) => setSelectedAssignRoomId(e.target.value)}
                  className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
                >
                  <option value="" className="dark:bg-[#181c24]">-- Choose Room Number --</option>
                  {rooms
                    .filter(r => r.room_type_id === assignRoomModalBooking.room_type_id)
                    .map(r => (
                      <option key={r.id} value={r.id} className="dark:bg-[#181c24]">
                        {r.id.startsWith('GV') || r.id.startsWith('PH') ? r.id : `Room ${r.id}`} - Fl {r.floor} ({r.status})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignRoomModalBooking(null)}
                  className="flex-1 py-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg text-[#71717A] dark:text-[#a1a1aa] hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!selectedAssignRoomId}
                  onClick={handleAssignRoomSubmit}
                  className="flex-1 py-3 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white rounded-lg font-medium disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  Assign Room
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Walk-in / Phone Reservation */}
      {walkinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#12151b] w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl p-5 sm:p-6 shadow-2xl border border-[#E8E4DA] dark:border-[#27272a] max-h-[90vh] overflow-y-auto pb-safe transition-colors">
            <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#18181B] dark:text-white mb-1">Walk-in Reservation</h3>
            <p className="text-xs text-[#71717A] dark:text-[#a1a1aa] mb-4">Immediate on-site guest intake or phone booking.</p>

            <form onSubmit={handleCreateWalkin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Guest Legal Name *</label>
                <input
                  type="text"
                  required
                  value={walkinGuestName}
                  onChange={(e) => setWalkinGuestName(e.target.value)}
                  placeholder="e.g. Lady Vivienne Montgomery"
                  className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={walkinEmail}
                    onChange={(e) => setWalkinEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Phone</label>
                  <input
                    type="tel"
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value)}
                    placeholder="+1 (555) 019-2831"
                    className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#27272A] dark:text-[#d4d4d8] mb-1">Suite Type</label>
                <select
                  value={walkinRoomType}
                  onChange={(e) => setWalkinRoomType(e.target.value)}
                  className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id} className="dark:bg-[#181c24]">
                      {rt.name} (${rt.base_price}/night)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-1">Check-in</label>
                  <input
                    type="date"
                    required
                    value={walkinCheckIn}
                    onChange={(e) => setWalkinCheckIn(e.target.value)}
                    className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-1">Check-out</label>
                  <input
                    type="date"
                    required
                    value={walkinCheckOut}
                    onChange={(e) => setWalkinCheckOut(e.target.value)}
                    className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-[#71717A] dark:text-[#a1a1aa] mb-1">Guests</label>
                  <select
                    value={walkinGuests}
                    onChange={(e) => setWalkinGuests(parseInt(e.target.value, 10))}
                    className="w-full p-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none"
                  >
                    <option value={1} className="dark:bg-[#181c24]">1 Guest</option>
                    <option value={2} className="dark:bg-[#181c24]">2 Guests</option>
                    <option value={3} className="dark:bg-[#181c24]">3 Guests</option>
                    <option value={4} className="dark:bg-[#181c24]">4 Guests</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWalkinModalOpen(false)}
                  className="flex-1 py-3 min-h-[44px] border border-[#D4CFBE] dark:border-[#27272a] rounded-lg text-[#71717A] dark:text-[#a1a1aa] hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white rounded-lg font-medium cursor-pointer shadow-xs"
                >
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT PHYSICAL ROOM UNIT ───────────────────────────────── */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="relative bg-white dark:bg-[#12151b] w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#E8E4DA] dark:border-[#27272a] p-5 sm:p-6 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-start justify-between pb-3 border-b border-[#E8E4DA] dark:border-[#27272a] mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DoorOpen className="w-5 h-5 text-[#B89358]" />
                  <h3 className="font-serif text-lg font-medium text-[#18181B] dark:text-white">
                    {roomModalMode === 'create' ? 'Add Physical Room Unit' : `Edit Room ${roomFormId}`}
                  </h3>
                </div>
                <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">
                  Configure room unit number, category assignment, floor level, and status.
                </p>
              </div>
              <button
                onClick={() => setRoomModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoom} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Room Number / Code
                  </label>
                  <input
                    type="text"
                    required
                    disabled={roomModalMode === 'edit'}
                    value={roomFormId}
                    onChange={(e) => setRoomFormId(e.target.value)}
                    placeholder="e.g. 401, GV-3"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358] disabled:bg-gray-100 dark:disabled:bg-zinc-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Floor Level
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={50}
                    value={roomFormFloor}
                    onChange={(e) => setRoomFormFloor(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                  Suite Category / Room Type
                </label>
                <select
                  value={roomFormTypeId}
                  onChange={(e) => setRoomFormTypeId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.id} className="dark:bg-[#181c24]">
                      {rt.name} (${rt.base_price}/night)
                    </option>
                  ))}
                </select>
              </div>

              {roomModalMode === 'edit' && (
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Current Operational Status
                  </label>
                  <select
                    value={roomFormStatus}
                    onChange={(e) => setRoomFormStatus(e.target.value as Room['status'])}
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  >
                    <option value="available" className="dark:bg-[#181c24]">Available (Vacant &amp; Inspected)</option>
                    <option value="occupied" className="dark:bg-[#181c24]">Occupied (Guest in residence)</option>
                    <option value="reserved" className="dark:bg-[#181c24]">Reserved (Pre-blocked)</option>
                    <option value="cleaning" className="dark:bg-[#181c24]">Cleaning (Housekeeping underway)</option>
                    <option value="maintenance" className="dark:bg-[#181c24]">Maintenance (Out of order)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                  Internal Staff Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={roomFormNotes}
                  onChange={(e) => setRoomFormNotes(e.target.value)}
                  placeholder="e.g. Turn-down lavender aroma requested, corner suite"
                  className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E4DA] dark:border-[#27272a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRoomModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingRoom}
                  className="px-5 py-2.5 min-h-[40px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {isSavingRoom ? 'Saving Unit...' : roomModalMode === 'create' ? 'Create Room Unit' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD / EDIT ROOM SUITE INFO & UPLOAD IMAGE ───────────────────── */}
      {suiteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
          <div className="relative bg-white dark:bg-[#12151b] w-full sm:max-w-2xl rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#E8E4DA] dark:border-[#27272a] p-5 sm:p-6 max-h-[92vh] overflow-y-auto transition-colors">
            <div className="flex items-start justify-between pb-3 border-b border-[#E8E4DA] dark:border-[#27272a] mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <BedDouble className="w-5 h-5 text-[#B89358]" />
                  <h3 className="font-serif text-lg font-medium text-[#18181B] dark:text-white">
                    {suiteModalMode === 'create' ? 'Create New Room Suite' : `Edit ${suiteFormName}`}
                  </h3>
                </div>
                <p className="text-xs text-[#71717A] dark:text-[#a1a1aa]">
                  Configure room suite information, pricing, capacity, amenities, and upload custom images.
                </p>
              </div>
              <button
                onClick={() => setSuiteModalOpen(false)}
                className="p-1 rounded-lg hover:bg-[#FAF9F6] dark:hover:bg-zinc-800 text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSuite} className="space-y-4">
              
              {/* Room Image Upload Preview */}
              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1.5">
                  Room Suite Image
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-4 p-3 bg-[#FAF9F6] dark:bg-[#181c24] rounded-xl border border-[#E8E4DA] dark:border-[#27272a]">
                  <div className="relative w-36 h-24 rounded-lg overflow-hidden bg-gray-200 dark:bg-zinc-800 border border-[#E8E4DA] dark:border-[#27272a] shrink-0">
                    <img
                      src={suiteFormImageUrl || '/src/assets/images/hero_luxury_hotel_1790748121852.jpg'}
                      alt="Room Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/src/assets/images/hero_luxury_hotel_1790748121852.jpg';
                      }}
                    />
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <label className="px-3.5 py-2 bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5 text-[#B89358] dark:text-[#0c0e12]" />
                        <span>{isUploadingImage ? 'Uploading Image...' : 'Upload Image from Computer'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileChange}
                          disabled={isUploadingImage}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-[#71717A] dark:text-[#a1a1aa]">Or Image URL / Path:</span>
                      <input
                        type="text"
                        value={suiteFormImageUrl}
                        onChange={(e) => setSuiteFormImageUrl(e.target.value)}
                        placeholder="/src/assets/images/room_deluxe_ocean_1790748144413.jpg"
                        className="flex-1 px-2.5 py-1 text-[11px] border border-[#E8E4DA] dark:border-[#27272a] rounded bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Suite Name
                  </label>
                  <input
                    type="text"
                    required
                    value={suiteFormName}
                    onChange={(e) => setSuiteFormName(e.target.value)}
                    placeholder="e.g. Royal Lagoon Ocean Villa"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Category Tag
                  </label>
                  <input
                    type="text"
                    value={suiteFormCategory}
                    onChange={(e) => setSuiteFormCategory(e.target.value)}
                    placeholder="e.g. Signature Suite, Private Villa"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                  Description &amp; Highlights
                </label>
                <textarea
                  rows={2}
                  required
                  value={suiteFormDescription}
                  onChange={(e) => setSuiteFormDescription(e.target.value)}
                  placeholder="Atmospheric description of the architecture, interior light, and signature sanctuary features."
                  className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Base Nightly ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={50}
                    step="10"
                    value={suiteFormPrice}
                    onChange={(e) => setSuiteFormPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Max Occupancy
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={suiteFormOccupancy}
                    onChange={(e) => setSuiteFormOccupancy(parseInt(e.target.value, 10) || 2)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Size (m²)
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    value={suiteFormSize}
                    onChange={(e) => setSuiteFormSize(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                    Bed Configuration
                  </label>
                  <input
                    type="text"
                    value={suiteFormBedType}
                    onChange={(e) => setSuiteFormBedType(e.target.value)}
                    placeholder="King Bed"
                    className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                  View &amp; Outlook
                </label>
                <input
                  type="text"
                  value={suiteFormViewType}
                  onChange={(e) => setSuiteFormViewType(e.target.value)}
                  placeholder="e.g. Direct Oceanfront Panoramic Horizon"
                  className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#18181B] dark:text-[#d4d4d8] mb-1">
                  Luxury Amenities (Comma-separated)
                </label>
                <input
                  type="text"
                  value={suiteFormAmenities}
                  onChange={(e) => setSuiteFormAmenities(e.target.value)}
                  placeholder="Marble Bath, Private Plunge Pool, 24/7 Butler, Organic Toiletries"
                  className="w-full px-3 py-2 text-xs border border-[#E8E4DA] dark:border-[#27272a] rounded-lg bg-white dark:bg-[#181c24] text-[#18181B] dark:text-white focus:outline-none focus:border-[#B89358]"
                />
              </div>

              <div className="pt-3 border-t border-[#E8E4DA] dark:border-[#27272a] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSuiteModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#71717A] dark:text-[#a1a1aa] hover:text-[#18181B] dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSuite}
                  className="px-6 py-2.5 min-h-[44px] bg-[#18181B] dark:bg-[#B89358] dark:text-[#0c0e12] hover:bg-[#B89358] text-white text-xs uppercase tracking-wider font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSavingSuite ? 'Saving Suite Info...' : suiteModalMode === 'create' ? 'Create Suite Category' : 'Save Suite Information'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
