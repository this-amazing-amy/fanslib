import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '~/lib/cn';

type LogoProps = {
  isCollapsed: boolean;
  className?: string;
};

export const Logo = ({ isCollapsed, className }: LogoProps) => {
  const renderLogo = (isFull: boolean, wrapperClassName?: string) => (
    <motion.div
      className={cn(
        'flex items-center gap-0 text-3xl font-semibold text-primary h-[2.5rem]',
        wrapperClassName
      )}
      style={{ fontFamily: "'Fredoka', sans-serif" }}
      animate={{
        translateY: isFull ? '4px' : '-2px',
      }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      <motion.span
        initial={false}
        animate={{
          width: isFull ? '4rem' : 0,
          opacity: isFull ? 1 : 0,
          translateY: isFull ? '1px' : '4px',
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1],
        }}
        className="overflow-hidden whitespace-nowrap block h-[2.5rem] text-right"
      >
        fans
      </motion.span>
      <motion.span
        className="block relative inline-flex items-center justify-center rounded-lg whitespace-nowrap"
        style={{ backgroundColor: 'rgb(229, 214, 254)' }}
        layout
        transition={{
          layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
        }}
        animate={{
          paddingLeft: isFull ? '0.2em' : '0',
          paddingRight: isFull ? '0' : '0',
          paddingTop: isFull ? '0' : '0',
          paddingBottom: isFull ? '0' : '0',
          marginLeft: isFull ? '0.1em' : '0',
          width: isFull ? '4rem': '2.5rem',
          height: '2.5rem',
        }}
      >
        <motion.div
          layout
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="shrink-0 flex items-center justify-center"
          animate={{
            marginRight: isFull ? '0.1em' : '0',
          }}
          style={{
            width: '1rem',
            height: '1rem',
          }}
        >
          <Heart className="w-full h-full text-white fill-white" />
        </motion.div>
        <motion.span
          initial={false}
          animate={{
            width: isFull ? '3rem' : 0,
            opacity: isFull ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="overflow-hidden whitespace-nowrap"
        >
          lib
        </motion.span>
      </motion.span>
    </motion.div>
  );

  return (
    <>
      <div className="flex items-center gap-2 lg:hidden">
        {renderLogo(true, cn('h-8', className))}
      </div>
      <div className="hidden lg:flex items-center justify-center">
        {renderLogo(!isCollapsed, cn(isCollapsed ? 'h-14' : 'h-8', className))}
      </div>
    </>
  );
};

