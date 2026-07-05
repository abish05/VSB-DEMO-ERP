import { motion } from 'framer-motion'
const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const itemVariants = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } }

export default function InactiveStudentsPage() {
  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold">Inactive Students</h1>
        <p className="text-muted-foreground text-sm mt-1">Students with no recent activity</p>
      </motion.div>
      <motion.div variants={itemVariants} className="stat-card flex items-center justify-center py-16">
        <p className="text-muted-foreground">Content coming soon...</p>
      </motion.div>
    </motion.div>
  )
}
