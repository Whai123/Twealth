// Utility to detect AI confirmation questions and extract action type

export interface ConfirmationPattern {
 detected: boolean;
 actionType?: 'goal' | 'transaction' | 'event' | 'budget' | 'group' | 'general';
 actionContext?: string;
}

export function detectConfirmation(message: string): ConfirmationPattern {
 const lowerMessage = message.toLowerCase();
 
 // Check for common confirmation patterns
 const confirmationPatterns = [
  /do you want me to (add|create|set up|schedule)/i,
  /would you like me to (add|create|set up|schedule)/i,
  /shall I (add|create|set up|schedule)/i,
  /should I (add|create|set up|schedule)/i,
  /want to (add|create|set up|schedule)/i,
  /ready to (add|create|set up|schedule)/i,
  /can I (add|create|set up|schedule)/i,
 ];

 const isConfirmation = confirmationPatterns.some(pattern => pattern.test(message));
 
 if (!isConfirmation) {
  return { detected: false };
 }

 // Determine action type based on keywords
 if (lowerMessage.includes('goal') || lowerMessage.includes('saving')) {
  return {
   detected: true,
   actionType: 'goal',
   actionContext: extractActionContext(message)
  };
 }
 
 if (lowerMessage.includes('transaction') || lowerMessage.includes('expense') || lowerMessage.includes('income')) {
  return {
   detected: true,
   actionType: 'transaction',
   actionContext: extractActionContext(message)
  };
 }
 
 if (lowerMessage.includes('event') || lowerMessage.includes('schedule') || lowerMessage.includes('reminder')) {
  return {
   detected: true,
   actionType: 'event',
   actionContext: extractActionContext(message)
  };
 }
 
 if (lowerMessage.includes('budget')) {
  return {
   detected: true,
   actionType: 'budget',
   actionContext: extractActionContext(message)
  };
 }
 
 if (lowerMessage.includes('group')) {
  return {
   detected: true,
   actionType: 'group',
   actionContext: extractActionContext(message)
  };
 }

 return {
  detected: true,
  actionType: 'general',
  actionContext: extractActionContext(message)
 };
}

function extractActionContext(message: string): string {
 // Extract the action being proposed (for display purposes)
 const match = message.match(/(?:add|create|set up|schedule)\s+(?:this|a|an|the)?\s*([^?.\n]+)/i);
 return match ? match[1].trim() : 'this action';
}
