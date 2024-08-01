const moment = require("moment");

function calculateAgeOfPost(createdAt) {
  return moment(createdAt).fromNow();
} 

function calculateAgeOfJob(createdAt) {
  const now = moment();
  const postDate = moment(createdAt);
  const diffInSeconds = now.diff(postDate, 'seconds');
  const diffInMinutes = now.diff(postDate, 'minutes');
  const diffInHours = now.diff(postDate, 'hours');
  const diffInDays = now.diff(postDate, 'days');
  const diffInWeeks = now.diff(postDate, 'weeks');
  const diffInMonths = now.diff(postDate, 'months');
  const diffInYears = now.diff(postDate, 'years');

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}mon`;
  } else {
    return `${diffInYears}yr`;
  }
}


module.exports = { calculateAgeOfPost, calculateAgeOfJob };
