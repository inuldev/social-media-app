'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

/**
 * Debug component to display post data for troubleshooting
 * Only visible in development mode
 */
const DebugPostData = ({ post }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Only show in development mode
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="w-full mb-4 border border-dashed border-gray-300 rounded-md"
    >
      <CollapsibleTrigger asChild>
        <Button variant="outline" size="sm" className="w-full text-xs">
          {isOpen ? 'Hide Debug Info' : 'Show Debug Info'}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <Card className="mt-2">
          <CardHeader>
            <CardTitle className="text-sm">Post Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs font-mono overflow-auto max-h-[300px]">
              <p><strong>Post ID:</strong> {post?._id}</p>
              <p><strong>Media URL:</strong> {post?.mediaUrl || 'None'}</p>
              <p><strong>Media Type:</strong> {post?.mediaType || 'None'}</p>
              <p><strong>Content:</strong> {post?.content || 'None'}</p>
              <p><strong>Created At:</strong> {post?.createdAt}</p>
              <p><strong>User ID:</strong> {post?.user?._id}</p>
              <p><strong>Username:</strong> {post?.user?.username}</p>
              
              {post?.mediaUrl && post?.mediaType === 'video' && (
                <div className="mt-2">
                  <p className="font-bold">Video Element Test:</p>
                  <video 
                    controls 
                    width="200" 
                    height="100"
                    className="mt-1 border border-gray-300"
                  >
                    <source src={post.mediaUrl} type="video/mp4" />
                    Your browser does not support the video tag
                  </video>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default DebugPostData;
