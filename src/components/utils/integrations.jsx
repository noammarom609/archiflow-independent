// WhatsApp Integration
export const sendWhatsApp = (phone, message) => {
  const encodedMessage = encodeURIComponent(message);
  const url = phone 
    ? `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodedMessage}`
    : `https://wa.me/?text=${encodedMessage}`;
  window.open(url, '_blank');
};

// Email Integration
export const sendEmail = (to, subject, body) => {
  const mailtoLink = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
};

// Calendar Integration - Generate ICS file
export const generateICS = (eventData) => {
  const { title, description, location, startDate, endDate } = eventData;
  
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ArchiFlow//Calendar//HE
BEGIN:VEVENT
UID:${Date.now()}@archiflow.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:${location || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = `${title.replace(/\s/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Google Calendar Link
export const openGoogleCalendar = (eventData) => {
  const { title, description, location, startDate, endDate } = eventData;
  
  const formatGoogleDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description,
    location: location || '',
    dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
};