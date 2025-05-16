<template>
  <img
    :src="processedSrc"
    :alt="alt"
    @error="handleError"
    v-bind="$attrs"
  />
</template>

<script>
export default {
  name: 'ImageWithFallback',
  inheritAttrs: false,
  props: {
    src: {
      type: String,
      default: ''
    },
    alt: {
      type: String,
      default: 'Image'
    },
    fallbackSrc: {
      type: String,
      default: '/fallback-image.png'
    }
  },
  data() {
    return {
      imgError: false
    }
  },
  computed: {
    processedSrc() {
      if (this.imgError) return this.fallbackSrc;
      
      let url = this.src;
      
      // 修复URL常见问题
      if (!url) return this.fallbackSrc;
      
      // 修复冒号后面的路径问题
      if (url.includes(':3000/')) {
        url = url.replace(':3000/', '');
      }
      
      // 修复等号代替斜杠的问题
      if (url.includes('avatar=')) {
        url = url.replace('avatar=', 'avatar/');
      }
      
      // 修复 uploads/avatars 问题
      if (url.includes('/uploads/avatar/') && !url.includes('/uploads/avatars/')) {
        url = url.replace('/uploads/avatar/', '/uploads/avatars/');
      }
      
      // 确保以斜杠开头
      if (!url.startsWith('/') && !url.startsWith('http')) {
        url = '/' + url;
      }
      
      return url;
    }
  },
  methods: {
    handleError() {
      console.log('Image load error:', this.src);
      this.imgError = true;
    }
  }
}
</script> 