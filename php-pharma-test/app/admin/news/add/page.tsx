"use client";

import TiptapEditor from "@/app/components/TiptapEditor";
import { useState, useEffect } from "react";
import Link from "next/link";
import { blogApi, informationApi, imageApi, Information } from "@/lib/api";

interface BlogSection {
  type: string;
  title: string;
  slug: string;
  content: string;
}

interface BlogFormData {
  title: string;
  slug: string;
  sections: BlogSection[];
  author: string;
  informationId: string;
  image: string;
  tags: string[];
  status: "draft" | "published";
}

export default function AdminAddNewsPage() {
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    sections: [],
    author: "",
    informationId: "",
    image: "",
    tags: [],
    status: "draft",
  });

  const [categories, setCategories] = useState<Information[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [tagInput, setTagInput] = useState("");

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await informationApi.getAll();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  }, [formData.title]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === "image") {
      setImagePreview(value);
    }
  };

  const handleContentChange = (content: string) => {
    setFormData((prev) => ({
      ...prev,
      sections: [
        {
          type: "text",
          title: prev.title,
          slug: prev.slug,
          content,
        },
      ],
    }));
  };

  const handleAddSection = () => {
    const newSection: BlogSection = {
      type: "text",
      title: "",
      slug: "",
      content: "",
    };
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }));
  };

  const handleSectionChange = (
    index: number,
    field: keyof BlogSection,
    value: string
  ) => {
    setFormData((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[index] = { ...updatedSections[index], [field]: value };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleRemoveSection = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleSectionTitleChange = (index: number, title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    setFormData((prev) => {
      const updatedSections = [...prev.sections];
      updatedSections[index] = {
        ...updatedSections[index],
        title,
        slug,
      };
      return { ...prev, sections: updatedSections };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Preview image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to server
      const result = await imageApi.upload(file, (progress) => {
        setUploadProgress(progress);
      });

      if (result.data && result.data.images && result.data.images[0]) {
        setFormData((prev) => ({ ...prev, image: result.data.images[0] }));
        setImagePreview(result.data.images[0]);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image");
    } finally {
      setUploadProgress(0);
    }
  };

  const handleTiptapImageUpload = async (file: File): Promise<string> => {
    try {
      const result = await imageApi.upload(file);
      if (result.data && result.data.images && result.data.images[0]) {
        return result.data.images[0];
      }
      throw new Error("No image URL returned");
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent,
    publishStatus: "draft" | "published"
  ) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const submitData = { ...formData, status: publishStatus };

      // Validate required fields
      if (!submitData.title || !submitData.slug || !submitData.author) {
        alert("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      if (submitData.sections.length === 0) {
        alert("Please add at least one section");
        setIsSubmitting(false);
        return;
      }

      // Validate sections
      for (let i = 0; i < submitData.sections.length; i++) {
        const section = submitData.sections[i];
        if (!section.title || !section.slug || !section.content) {
          alert(`Section ${i + 1} is incomplete. Please fill all fields.`);
          setIsSubmitting(false);
          return;
        }
      }

      const result = await blogApi.create(submitData);

      alert(
        publishStatus === "published"
          ? "Blog published successfully!"
          : "Blog saved as draft!"
      );

      // Reset form or redirect
      window.location.href = "/admin";
    } catch (error: any) {
      console.error("Error creating blog:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create blog";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Dashboard
              </Link>
              <div className="h-8 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Create New Blog Post
              </h1>
            </div>
            <Link
              href="/admin/blogs"
              className="px-4 py-2 text-sm text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              View All Posts
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <form className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Metadata */}
          <div className="lg:col-span-1 space-y-6">
            {/* Publish Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="font-semibold text-gray-800">Publish</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-black"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, "published")}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="animate-spin h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Publishing...
                      </span>
                    ) : (
                      "Publish Now"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, "draft")}
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Save as Draft
                  </button>
                </div>
              </div>
            </div>

            {/* Author Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h3 className="font-semibold text-gray-800">Author</h3>
              </div>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-black"
                placeholder="Enter author name"
              />
            </div>

            {/* Category Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <h3 className="font-semibold text-gray-800">Category</h3>
              </div>
              <select
                id="informationId"
                name="informationId"
                value={formData.informationId}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm text-black"
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Featured Image Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="font-semibold text-gray-800">Featured Image</h3>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    Upload Image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center">
                        {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="image"
                    className="block text-xs font-medium text-gray-600 mb-2"
                  >
                    Or enter image URL
                  </label>
                  <input
                    type="url"
                    id="image"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="https://..."
                  />
                </div>
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">
                      Preview:
                    </p>
                    <div className="rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"
                  />
                </svg>
                <h3 className="font-semibold text-gray-800">Tags</h3>
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-black"
                  placeholder="Add tag..."
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Add
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-full text-xs font-medium flex items-center gap-2 border border-blue-200"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-blue-600 hover:text-blue-800 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* Blog Title & Slug */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    Blog Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 text-xl font-medium border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                    placeholder="Enter an engaging title..."
                  />
                </div>
                <div>
                  <label
                    htmlFor="slug"
                    className="block text-sm font-semibold text-gray-700 mb-2"
                  >
                    URL Slug *
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">/blog/</span>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      required
                      className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                      placeholder="auto-generated-slug"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">
                    Auto-generated from title. Used in URL.
                  </p>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Content Sections
                  {formData.sections.length > 0 && (
                    <span className="text-sm font-normal text-gray-500">
                      ({formData.sections.length})
                    </span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={handleAddSection}
                  className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Section
                </button>
              </div>

              {formData.sections.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border-2 border-dashed border-gray-300 p-12 text-center">
                  <svg
                    className="w-16 h-16 text-gray-400 mx-auto mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No sections yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Add your first section to start creating content
                  </p>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Add First Section
                  </button>
                </div>
              )}

              {formData.sections.map((section, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg text-sm">
                        {index + 1}
                      </span>
                      <h3 className="font-semibold text-gray-800">
                        {section.title || `Section ${index + 1}`}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSection(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove section"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Section Title *
                        </label>
                        <input
                          type="text"
                          value={section.title}
                          onChange={(e) =>
                            handleSectionTitleChange(index, e.target.value)
                          }
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                          placeholder="Enter section title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Section Slug *
                        </label>
                        <input
                          type="text"
                          value={section.slug}
                          onChange={(e) =>
                            handleSectionChange(index, "slug", e.target.value)
                          }
                          className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-gray-50 text-black"
                          placeholder="auto-generated"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Content *
                      </label>
                      <TiptapEditor
                        content={section.content}
                        onChange={(content) =>
                          handleSectionChange(index, "content", content)
                        }
                        placeholder={`Write content for section ${
                          index + 1
                        }...`}
                        onImageUpload={handleTiptapImageUpload}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
