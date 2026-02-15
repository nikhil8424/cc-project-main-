import React, { useState } from "react";
import { AiOutlineCloudUpload } from "react-icons/ai";
import { MdDelete } from "react-icons/md";
import { uploadPost, uploadMultiplePosts } from "../services/firebase";
import { MoonLoader } from "react-spinners";
import {
    Await,
    Form,
    defer,
    redirect,
    useLoaderData,
    useNavigation,
} from "react-router-dom";
import { getCurrentUser } from "../services/firebase";
import LoadingPage from "../pages/LoadingPage";
import { requireAuth } from "../utils";

export async function loader({ request }) {
    await requireAuth(request);
    return defer({
        user: getCurrentUser(),
    });
}

export async function action({ request }) {
    const formData = await request.formData();
    const files = formData.getAll("images");
    const title = formData.get("title");
    const description = formData.get("description");
    const postedBy = formData.get("user-id");
    const tag = formData.get("tag");
    const uploadType = formData.get("upload-type");

    console.log('Action - Upload type:', uploadType);
    console.log('Action - Files received:', files.length);
    console.log('Action - Files:', files.map(f => f.name || 'unnamed'));

    try {
        if (uploadType === "folder" && files.length > 0) {
            // Handle multiple files (folder upload)
            console.log('Processing folder upload with', files.length, 'files');
            await uploadMultiplePosts({ title, description, files, postedBy, tag });
        } else {
            // Handle single file upload
            const file = files[0];
            if (file) {
                console.log('Processing single file upload');
                await uploadPost({ title, description, file, postedBy, tag });
            } else {
                console.error('No file provided for upload');
                return null;
            }
        }
        return redirect("/");
    } catch (e) {
        console.error("Upload error:", e);
        return null;
    }
}

const CreatePost = () => {
    const userPromise = useLoaderData();

    const [previewImg, setPreviewImg] = useState(null);
    const [previewImgs, setPreviewImgs] = useState([]);
    const [uploadType, setUploadType] = useState("single"); // 'single' or 'folder'
    const { state } = useNavigation();

    // Helper function to preview selected file(s)
    const uploadImage = (e) => {
        const files = Array.from(e.target.files);
        console.log('Total files selected:', files.length); // Debug log
        
        if (uploadType === "folder") {
            // Filter for image files only - more comprehensive check
            const imageFiles = files.filter(file => {
                if (!file || !file.type) return false;
                
                const validTypes = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 
                    'image/webp', 'image/svg+xml', 'image/bmp', 'image/tiff'
                ];
                
                // Also check by extension if type is not available
                const extension = file.name?.split('.').pop()?.toLowerCase();
                const validExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
                
                return validTypes.includes(file.type) || validExtensions.includes(extension);
            });
            
            console.log('Image files found:', imageFiles.length); // Debug log
            console.log('Image files:', imageFiles.map(f => f.name)); // Debug log
            
            // Handle multiple files for folder upload
            const previews = imageFiles.map((file, index) => {
                return new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.addEventListener("load", () => {
                        resolve({
                            name: file.name,
                            url: reader.result,
                            file: file,
                            index: index
                        });
                    });
                    reader.readAsDataURL(file);
                });
            });
            
            Promise.all(previews).then(results => {
                setPreviewImgs(results);
                console.log('Preview images set:', results.length); // Debug log
            });
        } else {
            // Handle single file upload
            const file = files[0];
            if (file) {
                const reader = new FileReader();
                reader.addEventListener("load", () => {
                    setPreviewImg(reader.result);
                });
                reader.readAsDataURL(file);
            }
        }
    };
    
    // Helper function to remove specific image from preview
    const removeImage = (index) => {
        const newPreviews = previewImgs.filter((_, i) => i !== index);
        setPreviewImgs(newPreviews);
    };
    
    // Helper function to clear all previews
    const clearAllPreviews = () => {
        setPreviewImg(null);
        setPreviewImgs([]);
    };

    function renderDetails(user) {
        return (
            <>
                <Form
                    className="w-4/5 flex flex-col gap-6 lg:pl-5"
                    encType="multipart/form-data"
                    method="post"
                >
                    {/* Upload Type Selection */}
                    <div className="flex gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="upload-type"
                                value="single"
                                checked={uploadType === "single"}
                                onChange={(e) => {
                                    setUploadType(e.target.value);
                                    clearAllPreviews();
                                }}
                                className="w-4 h-4"
                            />
                            <span className="font-medium">Single Image</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="radio"
                                name="upload-type"
                                value="folder"
                                checked={uploadType === "folder"}
                                onChange={(e) => {
                                    setUploadType(e.target.value);
                                    clearAllPreviews();
                                }}
                                className="w-4 h-4"
                            />
                            <span className="font-medium">Folder (Multiple Images)</span>
                        </label>
                    </div>
                    
                    {/* Upload File Here */}
                    <div className="flex w-full lg:flex-row flex-col justify-center items-center bg-white lg:p-5 p-3">
                        <div className="bg-gray-300 p-3 flex justify-center items-center flex-0.7 w-full h-[300px]">
                            <div className="flex justify-center items-center flex-col border-2 border-dotted border-gray-300 p-3 w-full h-full lg:h-420">
                                <label>
                                    <div className="flex flex-col items-center justify-center h-full">
                                        {!previewImg && previewImgs.length === 0 && (
                                            <>
                                                <div className="flex flex-col justify-center items-center">
                                                    <p className="font-bold text-2xl text-center">
                                                        <AiOutlineCloudUpload />
                                                    </p>
                                                    <p className="text-lg">
                                                        Click to upload {uploadType === "folder" ? "folder" : "image"}
                                                    </p>
                                                </div>
                                                <p className="text-gray-500 text-md text-center">
                                                    {uploadType === "folder" 
                                                        ? "Select a folder with multiple images"
                                                        : "Use high-quality JPG, PNG, SVG, GIF less than 20MB"
                                                    }
                                                </p>
                                            </>
                                        )}
                                        <input
                                            onChange={uploadImage}
                                            type="file"
                                            name="images"
                                            className="w-0 h-0"
                                            required
                                            multiple={uploadType === "folder"}
                                            {...(uploadType === "folder" && {
                                                webkitdirectory: "",
                                                directory: ""
                                            })}
                                            accept={uploadType === "folder" ? "image/*" : "image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"}
                                        />
                                        {uploadType === "folder" && (
                                            <div className="mt-2 text-xs text-gray-500 text-center">
                                                <p>💡 Tip: If folder selection doesn't work, try selecting multiple images manually (Ctrl/Cmd + Click)</p>
                                            </div>
                                        )}
                                    </div>
                                </label>
                                <div className="relative h-full w-full overflow-auto">
                                    {uploadType === "single" && previewImg && (
                                        <>
                                            <img
                                                src={previewImg}
                                                alt="upload-img"
                                                className="object-contain max-h-full"
                                            />
                                            <button
                                                onClick={() => setPreviewImg(null)}
                                                className="rounded-[50%] bg-white shadow-lg absolute bottom-8 right-8 hover:bg-gray-500 p-2 transition-colors duration-100 ease-in-out"
                                            >
                                                <MdDelete size={"2em"} />
                                            </button>
                                        </>
                                    )}
                                    {uploadType === "folder" && previewImgs.length > 0 && (
                                        <div className="relative">
                                            <div className="grid grid-cols-2 gap-2 p-2">
                                                {previewImgs.map((preview, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={preview.url}
                                                            alt={`upload-img-${index}`}
                                                            className="object-cover w-full h-32 rounded"
                                                        />
                                                        <button
                                                            onClick={() => removeImage(index)}
                                                            className="absolute top-1 right-1 rounded-[50%] bg-white shadow-lg hover:bg-gray-500 p-1 transition-colors duration-100 ease-in-out"
                                                        >
                                                            <MdDelete size={"1em"} />
                                                        </button>
                                                        <p className="text-xs text-center truncate mt-1">{preview.name}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <button
                                                onClick={clearAllPreviews}
                                                className="rounded bg-white shadow-lg absolute top-2 right-2 hover:bg-gray-500 p-2 transition-colors duration-100 ease-in-out"
                                            >
                                                <MdDelete size={"1.5em"} />
                                                <span className="text-xs ml-1">Clear All</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <img
                            src={
                                user.profilePic === null
                                    ? "./assets/noprofile.jpg"
                                    : user.profilePic
                            }
                            alt="user-profile"
                            className="w-[50px] aspect-square object-cover object-center rounded-[50%] p-1 "
                        />
                        <p className="font-bold text-black text-sm sm:text-lg">
                            {user.username}
                        </p>
                    </div>
                    <input
                        type="text"
                        placeholder="Add your title here"
                        className=" border-b-2 border-gray-400 outline-none p-2 text-sm sm:text-lg w-[70%] md:w-[50%]"
                        name="title"
                        required
                    />

                    <input
                        type="text"
                        placeholder="Add your Description here"
                        className=" border-b-2 border-gray-400 outline-none p-2 text-sm sm:text-lg w-[80%] md:w-[50%]"
                        name="description"
                        required
                    />

                    <input
                        type="text"
                        placeholder="Tag (this help others to search your Post)"
                        className=" border-b-2 border-gray-400 outline-none p-2 text-sm sm:text-lg w-[80%] md:w-[50%]"
                        required
                        name="tag"
                    />
                    <input
                        readOnly
                        aria-label="user-Id"
                        hidden
                        name="user-id"
                        value={user.userId}
                    />
                    <input
                        readOnly
                        aria-label="upload-type"
                        hidden
                        name="upload-type"
                        value={uploadType}
                    />
                    <button
                        disabled={state === "submitting"}
                        className={`flex items-center justify-center text-white text-sm md:text-base font-bold px-1 py-2 md:p-2 rounded-full w-28 outline-none hover:text-black hover:bg-gray-400 ${
                            state === "submitting" ? "bg-gray-500" : "bg-black"
                        } shadow-lg transition-colors duration-150 ease-in-out `}
                    >
                        {state === "submitting" ? (
                            <MoonLoader color="white" size={18} />
                        ) : (
                            uploadType === "folder" ? `Post ${previewImgs.length} Images` : "Post"
                        )}
                    </button>
                </Form>
            </>
        );
    }

    return (
        <div className="flex flex-col justify-center items-center gap-4">
            <React.Suspense fallback={<LoadingPage />}>
                <Await resolve={userPromise.user}>
                    {(user) => renderDetails(user)}
                </Await>
            </React.Suspense>
        </div>
    );
};

export default CreatePost;
