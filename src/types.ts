
export enum OrderStatus {
  PENDING = 'Pending',
  MEASUREMENT = 'Measurement',
  CUTTING = 'Cutting',
  STITCHING = 'Stitching',
  KAJ_BUTTON = 'Kaj-Button',
  FINISHING = 'Finishing', // Paresh
  READY = 'Ready for Delivery', // Return to Showroom
  DELIVERED = 'Delivered'
}

export enum WorkerRole {
  ADMIN = 'Admin',
  MANAGER = 'Manager', 
  SHOWROOM = 'Showroom',
  BOOKING_MASTER = 'Booking Master',
  MEASUREMENT = 'Measurement',
  CUTTING = 'Cutting Manager', // Updated
  // Specific Karigar Roles
  SHIRT_MAKER = 'Shirt Maker',
  PANT_MAKER = 'Pant Maker',
  COAT_MAKER = 'Coat Maker',
  SAFARI_MAKER = 'Safari Maker',   
  SHERWANI_MAKER = 'Sherwani Maker', 
  STITCHING = 'Stitching', // General
  MATERIAL = 'Material',
  KAJ_BUTTON = 'Kaj-Button',
  FINISHING = 'Finishing (Paresh)', // Updated
  DELIVERY = 'Delivery Boy',
  INVESTOR = 'Investor' // NEW ROLE
}

export enum ManagerRank {
  ASSOCIATE = 'Associate',
  CROWN_GOLD = 'Crown Gold', 
  ROYAL_BLACK = 'Royal Black', 
  SUPER_SHINE = 'Super Shine', 
  MASTER_PRO = 'Master Pro', 
  ULTRA_PRIME = 'Ultra Prime', 
  DIAMOND_ACE = 'Diamond Ace', 
  SUPER_KING = 'Super King', 
  SMART_LINE = 'Smart Line', 
  PRIME_STAR = 'Prime Star', 
  GRAND_PLUS = 'Grand Plus' 
}

export type WorkerGrade = 'A' | 'B' | 'C' | 'D' | 'E'; // New Grade System

export interface User {
  id: string;
  name: string;
  mobile: string;
  role: WorkerRole;
  grade?: WorkerGrade; // Added Grade
  password?: string;
  email?: string;
  profileImage?: string; 
  referralCode?: string;
  referredBy?: string; 
  totalReferralEarnings?: number;
  claimedReferralEarnings?: number; 
  walletPin?: string; 
  managerRank?: ManagerRank;
  rankAchievedDate?: string;
  measurementApprovalStatus?: 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface NetworkLevel {
  level: number;
  memberCount: number;
  totalEarnings: number;
  percentage: number;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  level: number;
  joinDate: string;
}

export interface ReferralIncomeLog {
  id: string;
  recipientId: string; 
  fromUserName: string;
  fromUserRole: string;
  action: string; 
  level: number;
  amount: number;
  date: string;
  time: string;
}

export interface Notification {
  id: string;
  recipientId?: string; 
  recipientRole?: WorkerRole; 
  title: string;
  message: string;
  relatedBillNumber?: string;
  timestamp: string;
  isRead: boolean;
}

export interface Announcement {
  id: string;
  text: string;
  imageUrl?: string;
  date: string;
  active: boolean;
}

export interface Measurements {
  // Shirt/Suit Upper
  length?: string;
  shoulder?: string;
  sleeve?: string;
  chest?: string;
  waist?: string; // Stomach
  neck?: string;
  collar?: string;
  forearm?: string;
  // Pant/Lower
  pLength?: string;
  pWaist?: string;
  hips?: string;
  thigh?: string;
  rise?: string; // Latak
  bottom?: string; // Mohri
  knee?: string;
  cuff?: string;
  pCuff?: string; // Pant Cuff
}

export interface Customer {
  id: string; 
  name: string;
  mobile: string;
  address: string;
  instagramId?: string;
  dob?: string;
  isNewCustomer: boolean;
  measurements: Measurements;
  measurementImage?: string; 
  createdAt: string;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  date: string;
  time: string;
  description?: string;
  updatedBy?: string;
}

export interface PaymentDetails {
  totalAmount: number;
  advanceAmount: number;
  pendingAmount: number;
  status: 'Paid' | 'Partial' | 'Pending';
}

export interface Order {
  billNumber: string; 
  customerId: string;
  customerName: string; 
  customerMobile?: string;
  customerAddress?: string; 
  customerIG?: string;
  customerDOB?: string;
  isNewCustomer: boolean;
  referralSource?: string;
  showroomName?: string; 
  orderDate: string;
  deliveryDate: string;
  trialDate: string;
  functionDate?: string;
  isUrgent?: boolean;
  priority?: 'High' | 'Medium' | 'Low'; 
  salesStaffId?: string;
  clothImages?: string[]; 
  patternImages?: string[]; 

  status: OrderStatus;
  items: string[];
  itemType: 'Pant' | 'Shirt' | 'Suit' | 'Sherwani' | 'Safari' | 'Pyjama' | 'Coat' | 'Kurta' | 'Trousers' | 'Jodhpuri' | 'Other';
  fabricAmount: number;
  assignedWorkerId?: string;
  assignedWorkerName?: string; 
  vipCategory?: string;
  history?: OrderHistoryEntry[];
  payment: PaymentDetails;
  notes?: string;
  voiceNotes?: string[]; 
  handoverPin?: string; 
}

export interface InventoryItem {
  id: string;
  name: string;
  type: 'Thread' | 'Canvas' | 'Button' | 'Zip' | 'Fabric' | 'Pant Button' | 'Hook' | 'Grip' | 'Collar Material' | 'Pocketing' | 'Belt Roll' | 'Patti Roll' | 'Lining' | 'Other';
  quantity: number;
  unit: string;
  costPerUnit?: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT'; 
  description: string; 
  date: string;
  timestamp: string;
  relatedBillNumber?: string;
}

export interface Investment {
  id: string;
  userId: string;
  principalAmount: number;
  totalTargetReturn: number; // 3x of Principal
  returnedSoFar: number;
  status: 'ACTIVE' | 'COMPLETED';
  startDate: string;
  lastPayoutDate?: string;
}
