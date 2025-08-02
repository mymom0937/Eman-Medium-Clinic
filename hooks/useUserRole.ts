import { useUser } from '@clerk/nextjs';

export const useUserRole = () => {
  const { user, isLoaded } = useUser();
  
  // Get role from Clerk's public metadata only
  const userRole = user?.publicMetadata?.role as string || 'SUPER_ADMIN';
  const userEmail = user?.emailAddresses[0]?.emailAddress || '';

  // Create a professional display name from email
  const getDisplayName = () => {
    if (userEmail) {
      const emailName = userEmail.split('@')[0];
      
      // Handle common email patterns and create professional display names
      let formattedName = emailName
        // Replace common separators with spaces
        .replace(/[._-]/g, ' ')
        // Handle numbers and special characters
        .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase to spaces
        .replace(/(\d+)/g, ' $1 ') // Add spaces around numbers
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
      
      // Capitalize first letter of each word
      formattedName = formattedName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
      
      // If the result is too long, truncate it
      if (formattedName.length > 20) {
        formattedName = formattedName.substring(0, 20) + '...';
      }
      
      return formattedName || 'User';
    }
    
    return 'User';
  };

  const userName = getDisplayName();

  return {
    user,
    isLoaded,
    userRole,
    userName,
    userEmail,
  };
}; 