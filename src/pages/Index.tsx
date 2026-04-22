import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Heart, Users, Calendar, Shield, ArrowRight, Handshake, Leaf, MessageSquare, Share2, Bookmark, ShoppingBag } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getPosts, getSessions, getProducts, getPublicSettings } from '@/lib/api';
import { resolveImageUrl } from '@/lib/utils';
import AIHealthAssistant from '@/components/AIHealthAssistant/AIHealthAssistant';



const GRID_FEATURES = [
  {
    emoji: '🥗',
    title: 'Nutrition',
    description:
      'Fuel your body with balanced, nutrient-rich foods designed to improve energy, immunity, and overall well-being.',
  },
  {
    emoji: '💪',
    title: 'Fitness',
    description:
      'Stay active and strong with guided workouts, training plans, and fitness tips that inspire consistency.',
  },
  {
    emoji: '🧠',
    title: 'Mental Wellness',
    description:
      'Prioritize your mind with practices that reduce stress, improve focus, and support emotional resilience.',
  },
  {
    emoji: '🧘',
    title: 'Yoga',
    description:
      'Align body and breath through intentional yoga sequences that improve flexibility and inner calm.',
  },
  {
    emoji: '🌿',
    title: 'Herbal Products',
    description:
      'Explore natural, plant-based remedies crafted to support health and healing using herbal wisdom.',
  },
  {
    emoji: '💊',
    title: 'Supplements',
    description:
      'Bridge nutritional gaps with high-quality supplements designed to support immunity, energy, and vitality.',
  },
  {
    emoji: '🌱',
    title: 'Ayurveda',
    description:
      'Experience the ancient science of holistic healing with personalized Ayurvedic practices for balance and longevity.',
  },
  {
    emoji: '⚖️',
    title: 'Weight Loss',
    description:
      'Achieve sustainable weight loss through balanced nutrition, mindful movement, and healthy lifestyle habits.',
  },
];

const MARQUEE_ITEMS = [
  'Nutrition',
  'Fitness',
  'Mental wellness',
  'Yoga',
  'Herbal products',
  'Supplements',
  'Ayurveda',
  'Weight loss',
];

const HERO_TOPICS = [
  'Nutrition',
  'Fitness',
  'Mental wellness',
  'Yoga',
  'Herbal products',
  'Supplements',
  'Ayurveda',
  'Weight loss',
];

const FEATURE_CARDS = [
  {
    emoji: '🥗',
    title: 'Nutrition',
    description:
      'Fuel your body with balanced, nutrient-rich foods designed to improve energy, immunity, and overall well-being. Discover healthy eating habits tailored for your lifestyle.',
  },
  {
    emoji: '💪',
    title: 'Fitness',
    description:
      'Stay active and strong with guided workouts, training plans, and fitness tips that help you build strength, endurance, and confidence.',
  },
  {
    emoji: '🧠',
    title: 'Mental Wellness',
    description:
      'Prioritize your mind with practices that reduce stress, improve focus, and support emotional well-being for a healthier, happier life.',
  },
  {
    emoji: '🧘',
    title: 'Yoga',
    description:
      'Achieve harmony of body and mind through yoga practices that enhance flexibility, reduce stress, and promote inner peace.',
  },
  {
    emoji: '🌿',
    title: 'Herbal Products',
    description:
      'Explore natural, plant-based remedies crafted to support health and healing using time-tested herbal solutions.',
  },
  {
    emoji: '💊',
    title: 'Supplements',
    description:
      'Bridge nutritional gaps with high-quality supplements designed to support immunity, energy, and overall health.',
  },
  {
    emoji: '🌱',
    title: 'Ayurveda',
    description:
      'Experience the ancient science of holistic healing with personalized Ayurvedic practices for balance, vitality, and longevity.',
  },
  {
    emoji: '⚖️',
    title: 'Weight Loss',
    description:
      'Achieve sustainable weight loss through balanced nutrition, effective workouts, and healthy lifestyle habits.',
  },
];



const features = [
  { icon: Heart, title: 'Health Discussions', desc: 'Share experiences and get support from a caring community.' },
  { icon: Calendar, title: 'Wellness Sessions', desc: 'Join live yoga, meditation, and nutrition workshops.' },
  { icon: Users, title: 'Community Support', desc: 'Connect with people who understand your journey.' },
  { icon: Shield, title: 'Safe Environment', desc: 'Moderated discussions ensuring respectful conversations.' },
];

const FEATURE_GRADIENTS = [
  'linear-gradient(145deg, #7A9E7E, #4F7153)',
  'linear-gradient(145deg, #C4714A, #E09070)',
  'linear-gradient(145deg, #4F7153, #1E1E1E)',
  'linear-gradient(145deg, #C8DBC9, #7A9E7E)',
];

export default function Index() {
  const { data: posts = [] } = useQuery({ queryKey: ['posts'], queryFn: () => getPosts() });
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: () => getSessions() });
  const { data: featuredProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'landing-highlight'],
    queryFn: () => getProducts({ popular: true })
  });
  const { data: publicSettings = {} } = useQuery({ queryKey: ['publicSettings'], queryFn: getPublicSettings });
  const previewPosts = posts.slice(0, 3);
  const previewSessions = sessions.slice(0, 2);
  const feedPostTypes = ['Articles', 'Short Tips', 'Videos', 'Product Reviews', 'Success Stories'];
  const feedHighlights = [
  {
    icon: MessageSquare,
    title: 'Voices You Can Trust',
    desc: 'Posts published by Admins, certified Experts, approved Affiliates, and trusted Brand partners.'
  },
  {
    icon: Share2,
    title: 'Meaningful Interactions',
    desc: 'React, comment, share, and save every shareable moment to keep conversations evolving.'
  },
  {
    icon: Bookmark,
    title: 'Save & Revisit',
    desc: 'Bookmark recipes, tips, and stories so your wellness library grows with every log-in.'
  }
];
const productFilters = ['Category', 'Price', 'Brand', 'Popular products'];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Custom Hero Banner */}
      <section className="relative overflow-hidden bg-[#F9F5EE] py-16">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-[#C4714A] before:h-[1px] before:w-8 before:bg-[#C4714A]"
              >
                Your Wellness Journey Starts Here
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.6 }}
                className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold leading-tight text-[#1E1E1E]"
              >
                A Safe Space for <span className="italic text-[#4F7153]">Body, Mind</span> &amp; Wellness
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="text-lg text-[#8A8478] max-w-2xl leading-relaxed"
              >
                Join a supportive community where you can discuss health topics, attend wellness sessions, and connect with others on their wellness journey..
              </motion.p>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65, duration: 0.6 }}
                className="flex flex-wrap gap-4"
              >
                <Button
                  size="lg"
                  className="hero-btn-solid cursor-grow rounded-full px-10 py-4 font-semibold text-base text-white transition-all"
                  asChild
                >
                  <Link to="/signup">Join H&amp;W Free</Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="hero-btn-ghost cursor-grow flex items-center gap-2 rounded-full px-10 py-4 font-semibold text-[#1E1E1E] transition-all"
                  asChild
                >
                  <Link to="/community">
                    <span className="play-icon">
                      <span />
                    </span>
                    Explore Community
                  </Link>
                </Button>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.95, duration: 0.6 }}
                className="grid grid-cols-2 gap-4 border-t border-[#C8DBC9] pt-6 text-[0.65rem] uppercase tracking-[0.4em] text-[#4F7153]"
              >
                {HERO_TOPICS.map(topic => (
                  <span key={topic} className="flex items-center gap-2 border-l border-[#C8DBC9] pl-3 first:border-none first:pl-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4F7153]" />
                    {topic}
                  </span>
                ))}
              </motion.div>
            </div>
            <div className="relative min-h-[420px] rounded-[36px] bg-[#C8DBC9] p-8">
              <motion.div
                className="absolute inset-0 z-0"
                initial={{ scale: 0.98 }}
                animate={{ scale: 1.02 }}
                transition={{ duration: 8, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
              >
                <svg className="w-full h-full" viewBox="0 0 360 420" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M40 200c80-60 180 80 260 40" stroke="#4F7153" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="120" cy="120" r="28" fill="#C8DBC9" stroke="#4F7153" strokeWidth="3" />
                  <circle cx="230" cy="80" r="20" fill="#F9F5EE" stroke="#4F7153" strokeWidth="3" />
                  <path d="M60 260c45-30 60 25 95 18s65-34 95-10" stroke="#7A9E7E" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="180" cy="310" r="18" fill="#F9F5EE" stroke="#4F7153" strokeWidth="3" />
                  <path d="M20 340c60-50 140 10 200-20" stroke="#7A9E7E" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </motion.div>
              <motion.div
                className="floating-card bottom-10 left-6"
                initial={{ y: 0 }}
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#4F7153]">Community Members</p>
                <p className="font-display text-2xl font-semibold text-[#1E1E1E]">{publicSettings['hero_stat_nutrition'] || '0'}</p>
                <p className="text-sm text-[#8A8478]">Nutrition enthusiasts</p>
              </motion.div>
              <motion.div
                className="floating-card top-6 right-6"
                initial={{ y: 0 }}
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <p className="text-xs uppercase tracking-[0.2em] text-[#4F7153]">Fitness Members</p>
                <p className="font-display text-2xl font-semibold text-[#1E1E1E]">{publicSettings['hero_stat_fitness'] || '0'}</p>
                <p className="text-sm text-[#8A8478]">Active & growing</p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Marquee ticker */}
      <section className="overflow-hidden bg-[#4F7153] py-3">
        <div className="marquee-container">
          <div className="marquee-track">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, index) => (
              <span key={`${item}-${index}`} className="marquee-item">
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <AIHealthAssistant />

      {/* Features grid */}
      <motion.section
        className="bg-[#F2EBD9] py-16"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#C4714A]">Why H&amp;W</p>
              <h2 className="font-display text-4xl font-bold text-[#1E1E1E]">
                Everything you need to <span className="text-[#4F7153] italic">thrive</span>
              </h2>
            </div>
            <p className="max-w-xl text-sm text-[#8A8478]">
              A gentle, curated space for your holistic self. Explore growth-focused resources, guided sessions, and trusted partners that nurture your mind, body, and spirit.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {FEATURE_CARDS.map((card, index) => (
              <motion.article
                key={`${card.title}-${index}`}
                className="feature-card cursor-grow relative overflow-hidden rounded-[24px] p-6 shadow-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.6 }}
                viewport={{ once: true }}
                whileHover="hover"
              >
                <div className="absolute right-6 top-6 text-[4rem] font-display font-bold text-[#4F7153]/30">0{index + 1}</div>
                <div className="mb-6 flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-[#F9F5EE] text-[#4F7153] flex items-center justify-center text-2xl shadow-md feature-icon">
                    {card.emoji}
                  </div>
                  <h3 className="font-display text-2xl font-bold text-[#1E1E1E]">{card.title}</h3>
                </div>
                <p className="text-sm text-[#1E1E1E]/80 leading-relaxed">{card.description}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Why Health and Wellness */}
      <section className="py-24 bg-[#F9F5EE]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl font-bold text-[#1A2E05]">Why Health and Wellness?</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="rounded-2xl p-8 border border-border/40 shadow-sm text-center flex flex-col items-center group feature-gradient-card"
                style={{ background: FEATURE_GRADIENTS[i % FEATURE_GRADIENTS.length] }}
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-white/30 text-[#F9F5EE] transition-all feature-icon">
                  <f.icon className="h-7 w-7" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-white/80 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Explore Communities */}
      <section className="py-24 bg-[#F9F5EE] text-[#1E1E1E]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-semibold text-[#1E1E1E] mb-4">Explore Communities</h2>
            <p className="max-w-2xl mx-auto mb-8 text-[#8A8478]">
              Browse through our specialized wellness categories and find the community that speaks to you.
            </p>
            <Button variant="outline" className="rounded-xl border-[#4F7153]/30 bg-white text-[#4F7153] font-medium px-6" asChild>
              <Link to="/discussions" className="flex items-center gap-2">
                View All Communities <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {["Health Tips", "Fitness Advice", "Nutrition Guidance", "Mental Wellness", "Product Recommendations"].map((cat) => (
              <motion.div
                key={cat}
                whileHover={{ y: -5 }}
                className="bg-[#C8DBC9] rounded-2xl p-8 border border-[#4F7153]/30 text-center flex flex-col items-center justify-center gap-4 cursor-pointer transition-all hover:border-[#4F7153] hover:shadow-lg/30"
                onClick={() => window.location.href = `/discussions?category=${encodeURIComponent(cat)}`}
              >
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-white text-[#4F7153] border border-[#4F7153]/30">
                  <Leaf className="h-5 w-5" />
                </div>
                <span className="font-medium text-sm text-[#1E1E1E]">{cat}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Feed Spotlight */}
      <section className="py-24 bg-[#F9F5EE] relative overflow-hidden">
        <div className="section-sheen section-sheen-green hidden lg:block" aria-hidden="true" />
        <div className="section-spark section-spark-a hidden lg:block" aria-hidden="true" />
        <div className="section-spark section-spark-b hidden lg:block" aria-hidden="true" />
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Community Feed</p>
              <h2 className="font-display text-4xl font-bold text-[#1A2E05]">A social timeline for every wellness moment</h2>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                Discover health tips, fitness advice, nutrition guidance, mental wellness insights, and product recommendations in chronological
                order. Every post includes the author name, role (Expert / Affiliate / Brand / Admin), a descriptive title, rich media, and thoughtful text.
                React with likes, comments, shares, or save to keep the story in your personal vault.
              </p>
              <div className="flex flex-wrap gap-3">
                {feedPostTypes.map(type => (
                  <span key={type} className="text-sm font-semibold bg-white/70 rounded-full px-4 py-2 border border-white/70 shadow-sm">
                    {type}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="rounded-2xl px-8 h-14 font-bold" asChild>
                  <Link to="/community">Open Community Feed <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 font-bold text-[#1A2E05] border-[#1A2E05] hover:bg-[#1A2E05]/10" asChild>
                  <Link to="/signup">Contribute Your Story</Link>
                </Button>
              </div>
            </div>
            <div className="grid gap-4">
              {feedHighlights.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
                viewport={{ once: true }}
                className="community-highlight rounded-[2rem] p-6 border border-[#4F7153]/40 shadow-2xl flex flex-col gap-3 glow-card"
              >
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-white">{item.title}</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Discovery */}
      <section className="py-24 bg-[#F9F5EE] relative overflow-hidden">
        <div className="section-sheen section-sheen-cream hidden lg:block" aria-hidden="true" />
        <div className="section-spark section-spark-c hidden lg:block" aria-hidden="true" />
        <div className="container mx-auto px-4">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] items-start">
            <div className="space-y-6">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary">Product Discovery</p>
              <h2 className="font-display text-4xl font-bold text-[#1A2E05]">Browse curated health & wellness essentials</h2>
              <p className="text-muted-foreground max-w-2xl leading-relaxed">
                Each product page showcases glossy product images, an insightful description, the brand name, and transparent pricing.
                Use filters for category, price, brand, and the most popular picks to find what supports your routine.
              </p>
              <div className="flex flex-wrap gap-3 text-[11px] font-black uppercase tracking-[0.3em] text-primary">
                {productFilters.map(filter => (
                  <span key={filter} className="bg-primary/10 rounded-full px-3 py-1 border border-primary/20">
                    {filter}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="rounded-2xl px-8 h-14 font-bold" asChild>
                  <Link to="/products">Start Shopping <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 font-bold text-[#1A2E05] border-[#1A2E05] hover:bg-[#1A2E05]/10" asChild>
                  <Link to="/signup">Talk to an Expert</Link>
                </Button>
              </div>
            </div>
            <div className="bg-[#F2EBD9] rounded-[2rem] p-6 border border-[#D4C4A8]/60 shadow-xl/40 glow-card">
              <div className="flex items-center gap-4 mb-4">
                <ShoppingBag className="h-6 w-6 text-primary" />
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Featured</p>
                  <h3 className="font-black text-xl text-[#1A2E05]">Wellness Picks</h3>
                </div>
              </div>
                  <div className="space-y-4">
                    {productsLoading ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <p className="text-sm font-bold">Syncing premium products...</p>
                    <span className="text-xs tracking-tight">Please hang on</span>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {featuredProducts.slice(0, 3).map(product => (
                      <div key={product.id} className="bg-white rounded-2xl border border-border/40 p-4 flex gap-3 items-center">
                        <img 
                          src={resolveImageUrl(product.images?.[0])} 
                          alt={product.name} 
                          className="h-16 w-16 rounded-2xl object-cover border border-border/30" 
                          onError={(e) => {
                            e.currentTarget.src = 'https://placehold.co/400x300?text=No+Image';
                          }}
                        />
                        <div className="flex-1">
                          <p className="text-[11px] uppercase tracking-[0.3em] text-muted-foreground">{product.brand?.name || 'Wellspring'}</p>
                          <p className="font-black text-sm line-clamp-2">{product.name}</p>
                          <p className="text-sm text-primary font-bold">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(product.price)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Discussions */}
      <section className="py-24 bg-[#F4F4F1]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-4xl font-bold text-[#1A2E05]">Latest Discussions</h2>
            <Link to="/discussions" className="text-[#1A2E05] font-semibold flex items-center gap-1 hover:underline">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {previewPosts.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-muted-foreground italic">No discussions yet. Be the first to post!</div>
            ) : previewPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-8 shadow-sm border border-border/40 flex flex-col h-full"
              >
                <div className="inline-block bg-[#F4F4F1] text-[#1A2E05] text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-6 w-fit">
                  {post.category}
                </div>
                <h3 className="font-display text-xl font-bold mb-4 text-[#1A2E05] line-clamp-2">{post.title}</h3>
                <p className="text-muted-foreground text-sm mb-6 line-clamp-3 leading-relaxed flex-grow">
                  {post.description}
                </p>
                <div className="flex items-center justify-between pt-6 border-t border-border/40">
                  <span className="text-xs font-semibold text-[#1A2E05]">{post.authorName}</span>
                  <span className="text-xs text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Sessions */}
      <section className="py-24 bg-[#E8EDEA]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <h2 className="font-display text-4xl font-bold text-[#1A2E05]">Upcoming Sessions</h2>
            <Button variant="outline" className="rounded-xl border-[#D2DEC8] bg-[#D2DEC8]/50 hover:bg-[#D2DEC8] text-[#1A2E05] font-medium" asChild>
              <Link to="/sessions">View All <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {previewSessions.length > 0 ? previewSessions.map((session, i) => (
              <motion.div
                key={session.id}
                whileHover={{ y: -5 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-border/40 flex flex-col md:flex-row gap-6 hover:shadow-md transition-all"
              >
                <div className="flex-grow">
                  <h3 className="font-display text-2xl font-bold mb-3 text-[#1A2E05]">{session.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                    {session.description}
                  </p>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-medium text-muted-foreground">Host: <span className="text-[#1A2E05] font-bold">{session.hostName}</span></span>
                    <span className="text-xs text-muted-foreground">{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                </div>
              </motion.div>
            )) : (
              <div className="col-span-2 text-center py-12 text-muted-foreground italic">No upcoming sessions yet.</div>
            )}
          </div>
        </div>
      </section>

      {/* Partner With Us CTA */}
      <section className="py-24 bg-[#EEF7F1]">
        <div className="container mx-auto px-4">
          <div className="rounded-[2.5rem] border border-primary/10 bg-white/80 shadow-lg shadow-primary/10 p-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-primary">
                <Handshake className="h-6 w-6" />
                <p className="text-xs font-black uppercase tracking-[0.5em]">Partner With Us</p>
              </div>
              <h2 className="font-display text-4xl font-bold text-[#1A2E05]">Collaborate for healthier communities</h2>
              <p className="text-muted-foreground max-w-2xl">
                Wellness brands, studios, and practitioners are welcome to join health&wellness as partners. Share your expertise,
                host sessions, and co-create trusted resources while reaching an engaged community.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button size="lg" className="rounded-2xl px-8 h-14 font-bold" asChild>
                <Link to="/partner">Partner With Us <ArrowRight className="h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" className="rounded-2xl px-8 h-14 font-bold border-primary/40 text-primary hover:bg-primary/10" asChild>
                <Link to="/partner">Learn More</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
