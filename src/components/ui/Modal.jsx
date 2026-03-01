import { motion, AnimatePresence } from "framer-motion";

export default function Modal({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
            <div className="glass-card w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl max-h-[85vh] flex flex-col">
              <div className="flex justify-between items-center p-4 sm:p-6 pb-0">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="text-2xl hover:text-gray-600 dark:hover:text-gray-400 p-1">
                  &times;
                </button>
              </div>
              <div className="p-4 sm:p-6 pt-2 sm:pt-0 overflow-y-auto">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
