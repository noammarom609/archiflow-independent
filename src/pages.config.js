/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Calendar from './pages/Calendar';
import ClientPortal from './pages/ClientPortal';
// Clients page has been merged into People page
// import Clients from './pages/Clients';
import ConsultantPortal from './pages/ConsultantPortal';
import Consultants from './pages/Consultants';
import ContractorPortal from './pages/ContractorPortal';
import Contractors from './pages/Contractors';
import Dashboard from './pages/Dashboard';
import DesignLibrary from './pages/DesignLibrary';
import Financials from './pages/Financials';
import Home from './pages/Home';
import Journal from './pages/Journal';
import LandingAbout from './pages/LandingAbout';
import LandingBlog from './pages/LandingBlog';
import LandingContact from './pages/LandingContact';
import LandingHome from './pages/LandingHome';
import LandingPricing from './pages/LandingPricing';
import LandingPrivacy from './pages/LandingPrivacy';
import LandingTerms from './pages/LandingTerms';
import MeetingSummaries from './pages/MeetingSummaries';
import OAuthCallback from './pages/OAuthCallback';
import People from './pages/People';
import Projects from './pages/Projects';
import ProposalTemplates from './pages/ProposalTemplates';
import PublicApproval from './pages/PublicApproval';
import PublicContent from './pages/PublicContent';
import PublicContractorQuote from './pages/PublicContractorQuote';
import PublicMeetingBooking from './pages/PublicMeetingBooking';
import Recordings from './pages/Recordings';
import Settings from './pages/Settings';
import SiteMode from './pages/SiteMode';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SupplierPortal from './pages/SupplierPortal';
import Support from './pages/Support';
import Team from './pages/Team';
import TestTranscribe from './pages/TestTranscribe';
import ThemeSettings from './pages/ThemeSettings';
import TimeTracking from './pages/TimeTracking';
import UserManagement from './pages/UserManagement';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Calendar": Calendar,
    "ClientPortal": ClientPortal,
    // "Clients": Clients, // Merged into People page
    "ConsultantPortal": ConsultantPortal,
    "Consultants": Consultants,
    "ContractorPortal": ContractorPortal,
    "Contractors": Contractors,
    "Dashboard": Dashboard,
    "DesignLibrary": DesignLibrary,
    "Financials": Financials,
    "Home": Home,
    "Journal": Journal,
    "LandingAbout": LandingAbout,
    "LandingBlog": LandingBlog,
    "LandingContact": LandingContact,
    "LandingHome": LandingHome,
    "LandingPricing": LandingPricing,
    "LandingPrivacy": LandingPrivacy,
    "LandingTerms": LandingTerms,
    "MeetingSummaries": MeetingSummaries,
    "OAuthCallback": OAuthCallback,
    "People": People,
    "Projects": Projects,
    "ProposalTemplates": ProposalTemplates,
    "PublicApproval": PublicApproval,
    "PublicContent": PublicContent,
    "PublicContractorQuote": PublicContractorQuote,
    "PublicMeetingBooking": PublicMeetingBooking,
    "Recordings": Recordings,
    "Settings": Settings,
    "SiteMode": SiteMode,
    "SuperAdminDashboard": SuperAdminDashboard,
    "SupplierPortal": SupplierPortal,
    "Support": Support,
    "Team": Team,
    "TestTranscribe": TestTranscribe,
    "ThemeSettings": ThemeSettings,
    "TimeTracking": TimeTracking,
    "UserManagement": UserManagement,
}

export const pagesConfig = {
    mainPage: "LandingHome",
    Pages: PAGES,
    Layout: __Layout,
};