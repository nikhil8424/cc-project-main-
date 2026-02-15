import { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { checkIfLiked, likePost } from "../../services/firebase";

const LikeButton = ({ postId }) => {
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    async function checkIfLikedHelper() {
      const [, likeCount] = await checkIfLiked(postId);
      setLikeCount(likeCount);
    }
    checkIfLikedHelper();
  }, [postId]);

  async function handleLikeClick() {
    await likePost(postId);
    setIsLiked((prev) => !prev);
    //setting new updated like count
    const [, likeCount] = await checkIfLiked(postId);
    setLikeCount(likeCount);
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={handleLikeClick}>
        {isLiked ? <FaHeart size={24} /> : <FaRegHeart size={24} />}
      </button>
      <span className="font-medium">{likeCount} Likes</span>
    </div>
  );
};

export default LikeButton;
